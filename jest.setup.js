// Testing library matchers
import "@testing-library/jest-dom";

// 无障碍断言：expect(container).toHaveNoViolations()
import * as jestAxe from "jest-axe";
expect.extend(jestAxe.toHaveNoViolations);
