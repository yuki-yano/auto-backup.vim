export * as path from "jsr:@std/path@1.0.8";
export * as fs from "jsr:@std/fs@1.0.8";

export type { Denops } from "jsr:@denops/std@7.4.0"
export * as vars from "jsr:@denops/std@7.4.0/variable"

export { assert, ensure, is } from "jsr:@core/unknownutil@4.3.0"
export { Semaphore } from "jsr:@lambdalisue/async@2.1.1";

import dayjs from "https://esm.sh/dayjs@1.11.13";
import utc from "https://esm.sh/dayjs@1.11.13/plugin/utc";
import timezone from "https://esm.sh/dayjs@1.11.13/plugin/timezone";

export { dayjs, timezone, utc };
