import Testeranto from "testeranto/src/Pure";

import { IPartialNodeInterface, ITestImplementation, ITestSpecification, OT } from "testeranto/src/Types";

import { I } from "../test/test";

export default <O extends OT, M>(
  testInput: I["iinput"],
  testSpecifications: ITestSpecification<I, O>,
  testImplementations: ITestImplementation<I, O, M>,
  testInterface: IPartialNodeInterface<I>
) =>
  Testeranto(
    testInput,
    testSpecifications,
    testImplementations,
    testInterface
  );
