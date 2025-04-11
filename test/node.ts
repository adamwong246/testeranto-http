
import Testeranto from "../src/node";

import server from "./server"

import { ServerTestSpecification, ServerTestImplementation, M, O, testInterface } from "./test";

export default Testeranto<O, M>(
  server,
  ServerTestSpecification,
  ServerTestImplementation,
  testInterface
);
