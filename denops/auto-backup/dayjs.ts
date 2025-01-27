import { dayjs, timezone, utc } from "./deps.ts";

dayjs.extend(utc);
dayjs.extend(timezone);

export const dayjsJST = (date?: string | Date) => {
  return dayjs(date).tz("Asia/Tokyo");
};
