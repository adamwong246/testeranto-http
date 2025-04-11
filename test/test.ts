

import assert from "assert";
import http from "http";
import {
  Ibdd_in,
  Ibdd_out,
  IPartialInterface,
  ITestImplementation,
  ITestSpecification,
} from "testeranto/src/Types";

export const ServerTestSpecification: ITestSpecification<I, O> = (
  Suite,
  Given,
  When,
  Then,
) => {
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
            When.PostToStatus("hello"),
          ],
          [Then.TheStatusIs("hello")]
        ),
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
    ),
  ];
};

export type O = Ibdd_out<
  {
    Default: string;
  },
  {
    AnEmptyState: [];
  },
  {
    PostToStatus: [string];
    PostToAdd: [number];
  },
  {
    TheStatusIs: [string];
    TheNumberIs: [number];
  },
  {
    AnEmptyState;
  }
  >;

export const ServerTestImplementation: ITestImplementation<I, O, M> = {
  suites: {
    Default: "some default Suite",
  },
  givens: {
    AnEmptyState: null,
  },
  whens: {
    PostToStatus: (status) => ["put_status", status],
    PostToAdd: (n) => ["put_number", n.toString()],
  },
  thens: {
    TheStatusIs: (s) => ["get_status", s],
    TheNumberIs: (n) => ["get_number", n.toString()],
  },
  checks: {
    AnEmptyState: null,
  },
};

export type I = Ibdd_in<
  string,
  http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>,
  http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>,
  string,
  [string, string],
  [string, string],
  any
  // (
  //   s: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
  // ) => [string, string]
  >;

export const testInterface: IPartialInterface<I> = {
  beforeEach: async (server, i, t) => {
    console.log("server listening")
    server.listen(t.ports[0]);
    return server;
  },
  butThen: async (server, thenCb, t) => {

    const [endpoint, payload] = await thenCb(server);

    
    return new Promise((resolve, reject) => {
      const reqPost = http
      .request(
        {
          port: t.ports[0],
          hostname: "localhost",
          path: "/" + endpoint,
          method: "GET",
          headers: {
              'Content-Type': 'application/text',
              // 'Content-Length': data.length
          }
        },
        (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            assert.deepStrictEqual(data, payload)
            resolve(data)
          });
        }
      )
      .on("error", (err) => {
        console.log("Error: ", err.message);
        reject()
      });

    reqPost.write(payload);
    reqPost.end();
    reqPost.on("error", function (e) {
      console.error(e);
    });
    })


  },
  andWhen: async (server, [endpoint, payload], t) => {
    return new Promise((resolve, reject) => {
      const reqPost = http
      .request(
        {
          port: t.ports[0],
          hostname: "localhost",
          path: endpoint,
          method: "POST",
          headers: {
              'Content-Type': 'application/text',
              // 'Content-Length': data.length
          }
        },
        (res) => {
          let data = "";

          // console.log("Status Code:", res.statusCode);

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            resolve(server);
            // console.log("Body: ", data);
            // resolve(JSON.parse(data))
          });
        }
      )
      .on("error", (err) => {
        console.log("Error: ", err.message);
        reject()
      });

    reqPost.write(payload);
    reqPost.end();
    reqPost.on("error", function (e) {
      console.error(e);
    });
    })
    

    return s;
  },
  afterEach: async (server) => {
    console.log("server closing")
    await server.close();
    return server
  }
};

export type M = {
  givens: {
    AnEmptyState: null
  };
  whens: {
    [K in keyof O["whens"]]: (...Iw: O["whens"][K]) => [string, string];
  };
  thens: {
    [K in keyof O["thens"]]: (...Iw: O["thens"][K]) => [string, string];
  };
  checks: {
    AnEmptyState: null
  }
};
