import type { SQL } from "pg-sql2";
import sql from "pg-sql2";
import { inspect } from "util";

interface PgPoint {
  x: number;
  y: number;
}

export function parsePoint(f: string): PgPoint {
  if (f[0] === "(" && f[f.length - 1] === ")") {
    const [x, y] = f
      .substring(1, f.length - 1)
      .split(",")
      .map((f) => parseFloat(f));
    return { x, y };
  } else {
    throw new Error(`Failed to parse point ${inspect(f)}`);
  }
}

export function stringifyPoint(point: PgPoint): string {
  return `(${point.x}, ${point.y})`;
}

export interface PgInterval {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Regexp construction enhanced from `postgres-interval`, which is licensed
// under the MIT license and is copyright (c) Ben Drucker <bvdrucker@gmail.com>
// (bendrucker.me).

const NUMBER = "([+-]?\\d+)";
const YEAR = `${NUMBER}\\s+years?`;
const MONTH = `${NUMBER}\\s+mons?`;
const DAY = `${NUMBER}\\s+days?`;
// NOTE: PostgreSQL automatically overflows seconds into minutes and minutes
// into hours, so we can rely on minutes and seconds always being 2 digits
// (plus decimal for seconds). The overflow stops at hours - hours do not
// overflow into days, so could be arbitrarily long.
const TIME = "([+-])?(\\d+):(\\d\\d):(\\d\\d(?:\\.\\d{1,6})?)";

const INTERVAL = new RegExp(
  "^" +
    // All parts of an interval are optional
    [YEAR, MONTH, DAY, TIME].map((str) => "(?:" + str + ")?").join("\\s*") +
    "$",
);

export function parseInterval(interval: string): PgInterval {
  const [, years, months, days, plusMinusTime, hours, minutes, seconds] =
    INTERVAL.exec(interval || "") || [];

  const timeMultiplier = plusMinusTime === "-" ? -1 : 1;

  return {
    years: years ? parseInt(years, 10) : 0,
    months: months ? parseInt(months, 10) : 0,
    days: days ? parseInt(days, 10) : 0,
    hours: hours ? timeMultiplier * parseInt(hours, 10) : 0,
    minutes: minutes ? timeMultiplier * parseInt(minutes, 10) : 0,
    // Seconds can be decimal; all other values are integer
    seconds: seconds ? timeMultiplier * parseFloat(seconds) : 0,
  };
}

export function stringifyInterval(interval: PgInterval): string {
  const keys = ["seconds", "minutes", "hours", "days", "months", "years"];
  const parts = [];
  for (const key of keys) {
    if (interval[key]) {
      parts.push(`${interval[key]} ${key}`);
    }
  }
  return parts.join(" ") || "0 seconds";
}
