import { IProject } from "testeranto/src/Types";

const config: IProject = {
  projects: {
    allTests: {
      tests: [
        ["./test/node.ts", "node", { ports: 1 }, []],
        // ["./test/pure.ts", "pure", { ports: 1 }, []],
        // ["./test/web.ts", "web", { ports: 0 }, []],
      ],
      clearScreen: false,
      debugger: false,
      externals: [],
      featureIngestor: function (s: string): Promise<string> {
        return new Promise((res) => res(""));
      },
      importPlugins: [],
      minify: false,
      nodePlugins: [],

      src: "",
      webPlugins: [],
      ports:["8889"]
    },
  },
};
export default config;
