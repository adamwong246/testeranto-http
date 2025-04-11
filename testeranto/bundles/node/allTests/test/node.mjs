import { createRequire } from 'module';const require = createRequire(import.meta.url);

// ../testeranto/src/lib/index.ts
var BaseTestInterface = {
  beforeAll: async (s2) => s2,
  beforeEach: async function(subject, initialValues, x, testResource, pm) {
    return subject;
  },
  afterEach: async (s2) => s2,
  afterAll: (store) => void 0,
  butThen: async (store, thenCb) => {
    return thenCb(store);
  },
  andWhen: async (a) => a,
  assertThis: (x) => null
};
var DefaultTestInterface = (p) => {
  return {
    ...BaseTestInterface,
    ...p
  };
};
var defaultTestResourceRequirement = {
  ports: 0
};

// ../testeranto/src/lib/pmProxy.ts
var prxy = function(pm, mappings) {
  return new Proxy(pm, {
    get: (target, prop, receiver) => {
      for (const mapping of mappings) {
        const method = mapping[0];
        const arger = mapping[1];
        if (prop === method) {
          return (x) => target[prop](arger(x));
        }
      }
      return (...x) => target[prop](...x);
    }
  });
};
var butThenProxy = (pm, filepath) => prxy(pm, [
  [
    "screencast",
    (opts, p) => [
      {
        ...opts,
        path: `${filepath}/butThen/${opts.path}`
      },
      p
    ]
  ],
  ["createWriteStream", (fp) => [`${filepath}/butThen/${fp}`]],
  [
    "writeFileSync",
    (fp, contents) => [`${filepath}/butThen/${fp}`, contents]
  ],
  [
    "customScreenShot",
    (opts, p) => [
      {
        ...opts,
        path: `${filepath}/butThen/${opts.path}`
      },
      p
    ]
  ]
]);
var andWhenProxy = (pm, filepath) => prxy(pm, [
  [
    "screencast",
    (opts, p) => [
      {
        ...opts,
        path: `${filepath}/andWhen/${opts.path}`
      },
      p
    ]
  ],
  ["createWriteStream", (fp) => [`${filepath}/andWhen/${fp}`]],
  ["writeFileSync", (fp, contents) => [`${filepath}/andWhen${fp}`, contents]],
  [
    "customScreenShot",
    (opts, p) => [
      {
        ...opts,
        path: `${filepath}/andWhen${opts.path}`
      },
      p
    ]
  ]
]);
var afterEachProxy = (pm, suite, given) => prxy(pm, [
  [
    "screencast",
    (opts, p) => [
      {
        ...opts,
        path: `suite-${suite}/given-${given}/afterEach/${opts.path}`
      },
      p
    ]
  ],
  ["createWriteStream", (fp) => [`suite-${suite}/afterEach/${fp}`]],
  [
    "writeFileSync",
    (fp, contents) => [
      `suite-${suite}/given-${given}/afterEach/${fp}`,
      contents
    ]
  ],
  [
    "customScreenShot",
    (opts, p) => [
      {
        ...opts,
        path: `suite-${suite}/given-${given}/afterEach/${opts.path}`
      },
      p
    ]
  ]
]);
var beforeEachProxy = (pm, suite) => prxy(pm, [
  [
    "screencast",
    (opts, p) => [
      {
        ...opts,
        path: `suite-${suite}/beforeEach/${opts.path}`
      },
      p
    ]
  ],
  [
    "writeFileSync",
    (fp, contents) => [`suite-${suite}/beforeEach/${fp}`, contents]
  ],
  [
    "customScreenShot",
    (opts, p) => [
      {
        ...opts,
        path: `suite-${suite}/beforeEach/${opts.path}`
      },
      p
    ]
  ],
  ["createWriteStream", (fp) => [`suite-${suite}/beforeEach/${fp}`]]
]);
var beforeAllProxy = (pm, suite) => prxy(pm, [
  [
    "writeFileSync",
    (fp, contents) => [`suite-${suite}/beforeAll/${fp}`, contents]
  ],
  [
    "customScreenShot",
    (opts, p) => [
      {
        ...opts,
        path: `suite-${suite}/beforeAll/${opts.path}`
      },
      p
    ]
  ],
  ["createWriteStream", (fp) => [`suite-${suite}/beforeAll/${fp}`]]
]);
var afterAllProxy = (pm, suite) => prxy(pm, [
  ["createWriteStream", (fp) => [`suite-${suite}/afterAll/${fp}`]],
  [
    "writeFileSync",
    (fp, contents) => [`suite-${suite}/afterAll/${fp}`, contents]
  ],
  [
    "customScreenShot",
    (opts, p) => [
      {
        ...opts,
        path: `suite-${suite}/afterAll/${opts.path}`
      },
      p
    ]
  ]
]);

// ../testeranto/src/lib/abstractBase.ts
var BaseSuite = class {
  constructor(name, index, givens = {}, checks = []) {
    this.name = name;
    this.index = index;
    this.givens = givens;
    this.checks = checks;
    this.fails = 0;
  }
  features() {
    const features = Object.keys(this.givens).map((k) => this.givens[k].features).flat().filter((value, index, array) => {
      return array.indexOf(value) === index;
    });
    return features || [];
  }
  toObj() {
    const givens = Object.keys(this.givens).map((k) => this.givens[k].toObj());
    const checks = Object.keys(this.checks).map((k) => this.checks[k].toObj());
    return {
      name: this.name,
      givens,
      checks,
      fails: this.fails,
      failed: this.failed,
      features: this.features()
    };
  }
  setup(s2, artifactory, tr, pm) {
    return new Promise((res) => res(s2));
  }
  assertThat(t) {
    return !!t;
  }
  afterAll(store, artifactory, pm) {
    return store;
  }
  async run(input, testResourceConfiguration, artifactory, tLog, pm) {
    this.testResourceConfiguration = testResourceConfiguration;
    const suiteArtifactory = (fPath, value) => artifactory(`suite-${this.index}-${this.name}/${fPath}`, value);
    tLog("\nSuite:", this.index, this.name);
    const sNdx = this.index;
    const subject = await this.setup(
      input,
      suiteArtifactory,
      testResourceConfiguration,
      beforeAllProxy(pm, sNdx.toString())
    );
    for (const [gKey, g] of Object.entries(this.givens)) {
      const giver = this.givens[gKey];
      try {
        this.store = await giver.give(
          subject,
          gKey,
          testResourceConfiguration,
          this.assertThat,
          suiteArtifactory,
          tLog,
          pm,
          sNdx
        );
      } catch (e) {
        this.failed = true;
        this.fails = this.fails + 1;
      }
    }
    for (const [ndx, thater] of this.checks.entries()) {
      await thater.check(
        subject,
        thater.name,
        testResourceConfiguration,
        this.assertThat,
        suiteArtifactory,
        tLog,
        pm
      );
    }
    try {
      this.afterAll(
        this.store,
        artifactory,
        afterAllProxy(pm, sNdx.toString())
      );
    } catch (e) {
      console.error(e);
    }
    return this;
  }
};
var BaseGiven = class {
  constructor(name, features, whens, thens, givenCB, initialValues) {
    this.name = name;
    this.features = features;
    this.whens = whens;
    this.thens = thens;
    this.givenCB = givenCB;
    this.initialValues = initialValues;
  }
  beforeAll(store) {
    return store;
  }
  toObj() {
    return {
      key: this.key,
      name: this.name,
      whens: this.whens.map((w) => w.toObj()),
      thens: this.thens.map((t) => t.toObj()),
      error: this.error ? [this.error, this.error.stack] : null,
      failed: this.failed,
      features: this.features
    };
  }
  async afterEach(store, key, artifactory, pm) {
    return store;
  }
  async give(subject, key, testResourceConfiguration, tester, artifactory, tLog, pm, suiteNdx) {
    this.key = key;
    tLog(`
 ${this.key}`);
    tLog(`
 Given: ${this.name}`);
    const givenArtifactory = (fPath, value) => artifactory(`given-${key}/${fPath}`, value);
    this.uberCatcher((e) => {
      console.error(e);
      this.error = e.error;
      tLog(e.stack);
    });
    try {
      this.store = await this.givenThat(
        subject,
        testResourceConfiguration,
        givenArtifactory,
        this.givenCB,
        this.initialValues,
        beforeEachProxy(pm, suiteNdx.toString())
      );
    } catch (e) {
      console.error("failure 4 ", e);
      this.error = e;
      throw e;
    }
    try {
      for (const [whenNdx, whenStep] of this.whens.entries()) {
        await whenStep.test(
          this.store,
          testResourceConfiguration,
          tLog,
          pm,
          `suite-${suiteNdx}/given-${key}/when/${whenNdx}`
        );
      }
      for (const [thenNdx, thenStep] of this.thens.entries()) {
        const t = await thenStep.test(
          this.store,
          testResourceConfiguration,
          tLog,
          pm,
          `suite-${suiteNdx}/given-${key}/then-${thenNdx}`
        );
        return tester(t);
      }
    } catch (e) {
      this.failed = true;
      tLog(e.stack);
      throw e;
    } finally {
      try {
        await this.afterEach(
          this.store,
          this.key,
          givenArtifactory,
          afterEachProxy(pm, suiteNdx.toString(), key)
        );
      } catch (e) {
        console.error("afterEach failed!", e);
        this.failed = e;
        throw e;
      }
    }
    return this.store;
  }
};
var BaseWhen = class {
  constructor(name, whenCB) {
    this.name = name;
    this.whenCB = whenCB;
  }
  toObj() {
    return {
      name: this.name,
      error: this.error
    };
  }
  async test(store, testResourceConfiguration, tLog, pm, filepath) {
    tLog(" When:", this.name);
    return await this.andWhen(
      store,
      this.whenCB,
      testResourceConfiguration,
      andWhenProxy(pm, filepath)
    ).catch((e) => {
      this.error = true;
    });
  }
};
var BaseThen = class {
  constructor(name, thenCB) {
    this.name = name;
    this.thenCB = thenCB;
    this.error = false;
  }
  toObj() {
    return {
      name: this.name,
      error: this.error
    };
  }
  async test(store, testResourceConfiguration, tLog, pm, filepath) {
    return this.butThen(
      store,
      async (s2) => {
        tLog(" Then!!!:", this.name);
        if (typeof this.thenCB === "function") {
          return await this.thenCB(s2);
        } else {
          return this.thenCB;
        }
      },
      testResourceConfiguration,
      butThenProxy(pm, filepath)
    ).catch((e) => {
      console.log("test failed 3", e);
      this.error = e;
      throw e;
    });
  }
  check() {
  }
};
var BaseCheck = class {
  constructor(name, features, checker, x, checkCB) {
    this.name = name;
    this.features = features;
    this.checkCB = checkCB;
    this.checker = checker;
  }
  toObj() {
    return {
      key: this.key,
      name: this.name,
      // functionAsString: this.checkCB.toString(),
      features: this.features
    };
  }
  async afterEach(store, key, artifactory, pm) {
    return store;
  }
  beforeAll(store) {
    return store;
  }
  async check(subject, key, testResourceConfiguration, tester, artifactory, tLog, pm) {
    this.key = key;
    tLog(`
 Check: ${this.name}`);
    this.store = await this.checkThat(
      subject,
      testResourceConfiguration,
      artifactory,
      this.checkCB,
      this.initialValues,
      pm
    );
    await this.checker(this.store, pm);
    return;
  }
};

// ../testeranto/src/lib/basebuilder.ts
var BaseBuilder = class {
  constructor(input, suitesOverrides, givenOverides, whenOverides, thenOverides, checkOverides, testResourceRequirement, testSpecification) {
    this.artifacts = [];
    this.artifacts = [];
    this.testResourceRequirement = testResourceRequirement;
    this.suitesOverrides = suitesOverrides;
    this.givenOverides = givenOverides;
    this.whenOverides = whenOverides;
    this.thenOverides = thenOverides;
    this.checkOverides = checkOverides;
    this.testSpecification = testSpecification;
    this.specs = testSpecification(
      this.Suites(),
      this.Given(),
      this.When(),
      this.Then(),
      this.Check()
    );
    this.testJobs = this.specs.map((suite) => {
      const suiteRunner = (suite2) => async (puppetMaster, tLog) => {
        const x = await suite2.run(
          input,
          puppetMaster.testResourceConfiguration,
          (fPath, value) => puppetMaster.testArtiFactoryfileWriter(
            tLog,
            (p) => {
              this.artifacts.push(p);
            }
          )(puppetMaster.testResourceConfiguration.fs + "/" + fPath, value),
          tLog,
          puppetMaster
        );
        return x;
      };
      const runner = suiteRunner(suite);
      return {
        test: suite,
        toObj: () => {
          return suite.toObj();
        },
        runner,
        receiveTestResourceConfig: async function(puppetMaster) {
          const start = await puppetMaster.start();
          const logFilePath = "log.txt";
          const access = await puppetMaster.createWriteStream(
            logFilePath
          );
          const tLog = async (...l) => {
            const x = await puppetMaster.write(access, `${l.toString()}
`);
          };
          const suiteDone = await runner(puppetMaster, tLog);
          const logPromise = new Promise(async (res, rej) => {
            await puppetMaster.end(access);
            res(true);
          });
          const fails = suiteDone.fails;
          await puppetMaster.writeFileSync(`bdd_errors.txt`, fails.toString());
          await puppetMaster.writeFileSync(
            `tests.json`,
            JSON.stringify(this.toObj(), null, 2)
          );
          return {
            failed: fails > 0,
            fails,
            artifacts: this.artifacts || [],
            logPromise,
            features: suiteDone.features()
          };
        }
      };
    });
  }
  // testsJson() {
  //   puppetMaster.writeFileSync(
  //     `tests.json`,
  //     JSON.stringify({ features: suiteDone.features() }, null, 2)
  //   );
  // }
  Specs() {
    return this.specs;
  }
  Suites() {
    return this.suitesOverrides;
  }
  Given() {
    return this.givenOverides;
  }
  When() {
    return this.whenOverides;
  }
  Then() {
    return this.thenOverides;
  }
  Check() {
    return this.checkOverides;
  }
};

// ../testeranto/src/lib/classBuilder.ts
var ClassBuilder = class extends BaseBuilder {
  constructor(testImplementation, testSpecification, input, suiteKlasser, givenKlasser, whenKlasser, thenKlasser, checkKlasser, testResourceRequirement) {
    const classySuites = Object.entries(testImplementation.suites).reduce(
      (a, [key], index) => {
        a[key] = (somestring, givens, checks) => {
          return new suiteKlasser.prototype.constructor(
            somestring,
            index,
            givens,
            checks
          );
        };
        return a;
      },
      {}
    );
    const classyGivens = Object.entries(testImplementation.givens).reduce(
      (a, [key, g]) => {
        a[key] = (features, whens, thens) => {
          return new givenKlasser.prototype.constructor(
            key,
            features,
            whens,
            thens,
            testImplementation.givens[key]
            // givEn
          );
        };
        return a;
      },
      {}
    );
    const classyWhens = Object.entries(testImplementation.whens).reduce(
      (a, [key, whEn]) => {
        a[key] = (payload) => {
          return new whenKlasser.prototype.constructor(
            `${whEn.name}: ${payload && payload.toString()}`,
            whEn(payload)
          );
        };
        return a;
      },
      {}
    );
    const classyThens = Object.entries(testImplementation.thens).reduce(
      (a, [key, thEn]) => {
        a[key] = (expected, x) => {
          return new thenKlasser.prototype.constructor(
            `${thEn.name}: ${expected && expected.toString()}`,
            // () => {
            //   thEn(expected);
            //   // return new Promise((res), rej) => {
            //   // }
            //   // try {
            //   //   thEn(expected);
            //   // } catch (c) {
            //   //   console.log("mark99");
            //   // }
            // },
            thEn(expected)
          );
        };
        return a;
      },
      {}
    );
    const classyChecks = Object.entries(testImplementation.checks).reduce(
      (a, [key, chEck]) => {
        a[key] = (name, features, checker) => {
          return new checkKlasser.prototype.constructor(
            key,
            features,
            chEck,
            checker
          );
        };
        return a;
      },
      {}
    );
    super(
      input,
      classySuites,
      classyGivens,
      classyWhens,
      classyThens,
      classyChecks,
      testResourceRequirement,
      testSpecification
    );
  }
};

// ../testeranto/src/lib/core.ts
var Testeranto = class extends ClassBuilder {
  constructor(input, testSpecification, testImplementation, testResourceRequirement = defaultTestResourceRequirement, testInterface2, uberCatcher) {
    const fullTestInterface = DefaultTestInterface(testInterface2);
    super(
      testImplementation,
      testSpecification,
      input,
      class extends BaseSuite {
        afterAll(store, artifactory, pm) {
          return fullTestInterface.afterAll(store, pm);
        }
        assertThat(t) {
          return fullTestInterface.assertThis(t);
        }
        async setup(s2, artifactory, tr, pm) {
          return (fullTestInterface.beforeAll || (async (input2, artifactory2, tr2, pm2) => input2))(
            s2,
            this.testResourceConfiguration,
            // artifactory,
            pm
          );
        }
      },
      class Given extends BaseGiven {
        constructor() {
          super(...arguments);
          this.uberCatcher = uberCatcher;
        }
        async givenThat(subject, testResource, artifactory, initializer, initialValues, pm) {
          return fullTestInterface.beforeEach(
            subject,
            initializer,
            testResource,
            initialValues,
            pm
          );
        }
        afterEach(store, key, artifactory, pm) {
          return new Promise(
            (res) => res(fullTestInterface.afterEach(store, key, pm))
          );
        }
      },
      class When extends BaseWhen {
        async andWhen(store, whenCB, testResource, pm) {
          try {
            return await fullTestInterface.andWhen(
              store,
              whenCB,
              testResource,
              pm
            );
          } catch (e) {
            throw e;
          }
        }
      },
      class Then extends BaseThen {
        async butThen(store, thenCB, testResource, pm) {
          return await fullTestInterface.butThen(
            store,
            thenCB,
            testResource,
            pm
          );
        }
      },
      class Check extends BaseCheck {
        constructor(name, features, checkCallback, x, i, c) {
          super(name, features, checkCallback, x, c);
          this.initialValues = i;
        }
        async checkThat(subject, testResourceConfiguration, artifactory, initializer, initialValues, pm) {
          return fullTestInterface.beforeEach(
            subject,
            initializer,
            testResourceConfiguration,
            initialValues,
            pm
          );
        }
        afterEach(store, key, artifactory, pm) {
          return new Promise(
            (res) => res(fullTestInterface.afterEach(store, key, pm))
          );
        }
      },
      testResourceRequirement
    );
  }
};

// ../testeranto/src/PM/node.ts
import net from "net";
import fs from "fs";
import path from "path";

// ../testeranto/src/PM/index.ts
var PM = class {
};

// ../testeranto/src/PM/node.ts
var fPaths = [];
var PM_Node = class extends PM {
  constructor(t) {
    super();
    this.testResourceConfiguration = t;
  }
  start() {
    return new Promise((res) => {
      process.on("message", (message) => {
        if (message.path) {
          this.client = net.createConnection(message.path, () => {
            res();
          });
        }
      });
    });
  }
  stop() {
    throw new Error("Method not implemented.");
  }
  send(command, ...argz) {
    return new Promise((res) => {
      const key = Math.random().toString();
      const myListener = (event) => {
        const x = JSON.parse(event);
        if (x.key === key) {
          process.removeListener("message", myListener);
          res(x.payload);
        }
      };
      process.addListener("message", myListener);
      this.client.write(JSON.stringify([command, ...argz, key]));
    });
  }
  async pages() {
    return this.send("pages", ...arguments);
  }
  waitForSelector(p, s2) {
    return this.send("waitForSelector", ...arguments);
  }
  closePage(p) {
    return this.send("closePage", ...arguments);
  }
  goto(page, url) {
    return this.send("goto", ...arguments);
  }
  async newPage() {
    return this.send("newPage");
  }
  $(selector) {
    return this.send("$", ...arguments);
  }
  isDisabled(selector) {
    return this.send("isDisabled", ...arguments);
  }
  getAttribute(selector, attribute) {
    return this.send("getAttribute", ...arguments);
  }
  getValue(selector) {
    return this.send("getValue", ...arguments);
  }
  focusOn(selector) {
    return this.send("focusOn", ...arguments);
  }
  typeInto(selector) {
    return this.send("typeInto", ...arguments);
  }
  page() {
    return this.send("page");
  }
  click(selector) {
    return this.send("click", ...arguments);
  }
  screencast(opts, page) {
    return this.send(
      "screencast",
      {
        ...opts,
        path: this.testResourceConfiguration.fs + "/" + opts.path
      },
      page,
      this.testResourceConfiguration.name
    );
  }
  screencastStop(p) {
    return this.send("screencastStop", ...arguments);
  }
  customScreenShot(opts, page) {
    return this.send(
      "customScreenShot",
      {
        ...opts,
        path: this.testResourceConfiguration.fs + "/" + opts.path
      },
      page,
      this.testResourceConfiguration.name
    );
  }
  async existsSync(destFolder) {
    return await this.send(
      "existsSync",
      this.testResourceConfiguration.fs + "/" + destFolder
    );
  }
  mkdirSync() {
    return this.send("mkdirSync", this.testResourceConfiguration.fs + "/");
  }
  async write(uid, contents) {
    return await this.send("write", ...arguments);
  }
  async writeFileSync(filepath, contents) {
    return await this.send(
      "writeFileSync",
      this.testResourceConfiguration.fs + "/" + filepath,
      contents,
      this.testResourceConfiguration.name
    );
  }
  async createWriteStream(filepath) {
    return await this.send(
      "createWriteStream",
      this.testResourceConfiguration.fs + "/" + filepath,
      this.testResourceConfiguration.name
    );
  }
  async end(uid) {
    return await this.send("end", ...arguments);
  }
  async customclose() {
    return await this.send(
      "customclose",
      this.testResourceConfiguration.fs,
      this.testResourceConfiguration.name
    );
  }
  testArtiFactoryfileWriter(tLog, callback) {
    return (fPath, value) => {
      callback(
        new Promise((res, rej) => {
          tLog("testArtiFactory =>", fPath);
          const cleanPath = path.resolve(fPath);
          fPaths.push(cleanPath.replace(process.cwd(), ``));
          const targetDir = cleanPath.split("/").slice(0, -1).join("/");
          fs.mkdir(targetDir, { recursive: true }, async (error) => {
            if (error) {
              console.error(`\u2757\uFE0FtestArtiFactory failed`, targetDir, error);
            }
            fs.writeFileSync(
              path.resolve(
                targetDir.split("/").slice(0, -1).join("/"),
                "manifest"
              ),
              fPaths.join(`
`),
              {
                encoding: "utf-8"
              }
            );
            if (Buffer.isBuffer(value)) {
              fs.writeFileSync(fPath, value, "binary");
              res();
            } else if (`string` === typeof value) {
              fs.writeFileSync(fPath, value.toString(), {
                encoding: "utf-8"
              });
              res();
            } else {
              const pipeStream = value;
              const myFile = fs.createWriteStream(fPath);
              pipeStream.pipe(myFile);
              pipeStream.on("close", () => {
                myFile.close();
                res();
              });
            }
          });
        })
      );
    };
  }
  // launch(options?: PuppeteerLaunchOptions): Promise<Browser>;
  startPuppeteer(options) {
  }
};

// ../testeranto/src/Node.ts
var NodeTesteranto = class extends Testeranto {
  constructor(input, testSpecification, testImplementation, testResourceRequirement, testInterface2) {
    super(
      input,
      testSpecification,
      testImplementation,
      testResourceRequirement,
      testInterface2,
      () => {
      }
    );
  }
  async receiveTestResourceConfig(partialTestResource) {
    const t = JSON.parse(partialTestResource);
    const pm = new PM_Node(t);
    return await this.testJobs[0].receiveTestResourceConfig(pm);
  }
};
var testeranto = async (input, testSpecification, testImplementation, testInterface2, testResourceRequirement = defaultTestResourceRequirement) => {
  const t = new NodeTesteranto(
    input,
    testSpecification,
    testImplementation,
    testResourceRequirement,
    testInterface2
  );
  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
  });
  try {
    console.log(process.argv);
    const f = await t.receiveTestResourceConfig(process.argv[2]);
    console.error("goodbye node error", f.fails);
    process.exit(f.fails);
  } catch (e) {
    console.error("goodbye node error", e);
    process.exit(-1);
  }
  return t;
};
var Node_default = testeranto;

// src/node.ts
var node_default = (testInput, testSpecifications, testImplementations, testInterface2) => Node_default(
  testInput,
  testSpecifications,
  testImplementations,
  testInterface2
);

// test/server.ts
import http from "http";
var status = "some great status";
var counter = 0;
console.log("ehllo server");
var server = http.createServer(function(req, res) {
  console.log("mark", req.method, req.url);
  if (req.method === "GET") {
    if (req.url === "/get_status") {
      res.write(status);
      res.end();
      return;
    } else if (req.url === "/get_number") {
      res.write(counter.toString());
      res.end();
      return;
    } else {
      res.write("<p>error 404<p>");
      res.end();
      return;
    }
  } else if (req.method === "POST") {
    let body = "";
    req.on("data", function(chunk) {
      body += chunk;
    });
    req.on("end", function() {
      if (req.url === "/put_status") {
        status = body.toString();
        res.write("aok");
        res.end();
        return;
      } else if (req.url === "/put_number") {
        counter = counter + parseInt(body);
        res.write(counter.toString());
        res.end();
        return;
      } else {
        res.write("<p>error 404<p>");
        res.end();
        return;
      }
    });
  }
});
var server_default = server;

// test/test.ts
import assert from "assert";
import http2 from "http";
var ServerTestSpecification = (Suite, Given, When, Then) => {
  return [
    Suite.Default(
      "Testing the Node server with fetch!",
      {
        // test0: Given.AnEmptyState(
        //   [],
        //   [],
        //   [Then.TheStatusIs("some great status")]
        // ),
        test1: Given.AnEmptyState(
          [],
          [
            // When.PostToStatus("1"),
            // When.PostToStatus("2"),
            // When.PostToStatus("3"),
            // When.PostToStatus("4"),
            // When.PostToStatus("5"),
            // When.PostToStatus("6"),
            When.PostToStatus("hello")
          ],
          [Then.TheStatusIs("hello")]
        )
        // test2: Given.AnEmptyState(
        //   [],
        //   [When.PostToStatus("hello"), When.PostToStatus("aloha")],
        //   [Then.TheStatusIs("aloha")]
        // ),
        // "test2.5": Given.AnEmptyState(
        //   [],
        //   [When.PostToStatus("hola")],
        //   [Then.TheStatusIs("hola")]
        // ),
        // test3: Given.AnEmptyState([], [], [Then.TheNumberIs(0)]),
        // test5: Given.AnEmptyState(
        //   [],
        //   [When.PostToAdd(1), When.PostToAdd(2)],
        //   [Then.TheNumberIs(3)]
        // ),
        // test6: Given.AnEmptyState(
        //   [],
        //   [
        //     When.PostToStatus("aloha"),
        //     When.PostToAdd(4),
        //     When.PostToStatus("hello"),
        //     When.PostToAdd(3),
        //   ],
        //   [Then.TheStatusIs("hello"), Then.TheNumberIs(71)]
        // ),
      },
      []
    )
  ];
};
var ServerTestImplementation = {
  suites: {
    Default: "some default Suite"
  },
  givens: {
    AnEmptyState: null
  },
  whens: {
    PostToStatus: (status2) => ["put_status", status2],
    PostToAdd: (n) => ["put_number", n.toString()]
  },
  thens: {
    TheStatusIs: (s2) => ["get_status", s2],
    TheNumberIs: (n) => ["get_number", n.toString()]
  },
  checks: {
    AnEmptyState: null
  }
};
var testInterface = {
  beforeEach: async (server2, i, t) => {
    console.log("server listening");
    server2.listen(t.ports[0]);
    return server2;
  },
  butThen: async (server2, thenCb, t) => {
    const [endpoint, payload] = await thenCb(server2);
    return new Promise((resolve, reject) => {
      const reqPost = http2.request(
        {
          port: t.ports[0],
          hostname: "localhost",
          path: "/" + endpoint,
          method: "GET",
          headers: {
            "Content-Type": "application/text"
            // 'Content-Length': data.length
          }
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            assert.deepStrictEqual(data, payload);
            resolve(data);
          });
        }
      ).on("error", (err) => {
        console.log("Error: ", err.message);
        reject();
      });
      reqPost.write(payload);
      reqPost.end();
      reqPost.on("error", function(e) {
        console.error(e);
      });
    });
  },
  andWhen: async (server2, [endpoint, payload], t) => {
    return new Promise((resolve, reject) => {
      const reqPost = http2.request(
        {
          port: t.ports[0],
          hostname: "localhost",
          path: endpoint,
          method: "POST",
          headers: {
            "Content-Type": "application/text"
            // 'Content-Length': data.length
          }
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            resolve(server2);
          });
        }
      ).on("error", (err) => {
        console.log("Error: ", err.message);
        reject();
      });
      reqPost.write(payload);
      reqPost.end();
      reqPost.on("error", function(e) {
        console.error(e);
      });
    });
    return s;
  },
  afterEach: async (server2) => {
    console.log("server closing");
    await server2.close();
    return server2;
  }
};

// test/node.ts
var node_default2 = node_default(
  server_default,
  ServerTestSpecification,
  ServerTestImplementation,
  testInterface
);
export {
  node_default2 as default
};
