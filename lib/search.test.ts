import { describe, expect, it } from "vitest";
import { containsPattern, paginationItems, parsePage, parseQuery } from "./search";

describe("containsPattern", () => {
  it("оборачивает запрос в % для поиска подстроки", () => {
    expect(containsPattern("кофейня")).toBe("%кофейня%");
    expect(containsPattern("  acme  ")).toBe("%acme%");
  });

  it("экранирует спецсимволы LIKE", () => {
    expect(containsPattern("100%")).toBe("%100\\%%");
    expect(containsPattern("a_b")).toBe("%a\\_b%");
    expect(containsPattern("c:\\")).toBe("%c:\\\\%");
  });
});

describe("parsePage", () => {
  it("принимает только целые положительные номера", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage(["2", "5"])).toBe(2);
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-2")).toBe(1);
    expect(parsePage("1.5")).toBe(1);
    expect(parsePage("abc")).toBe(1);
  });
});

describe("parseQuery", () => {
  it("обрезает пробелы и слишком длинные строки", () => {
    expect(parseQuery("  acme ")).toBe("acme");
    expect(parseQuery(undefined)).toBe("");
    expect(parseQuery("x".repeat(500))).toHaveLength(100);
  });
});

describe("paginationItems", () => {
  it("показывает все страницы, если их мало", () => {
    expect(paginationItems(1, 1)).toEqual([1]);
    expect(paginationItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("сокращает длинный список многоточиями", () => {
    expect(paginationItems(2, 10)).toEqual([1, 2, 3, "...", 9, 10]);
    expect(paginationItems(9, 10)).toEqual([1, 2, "...", 8, 9, 10]);
    expect(paginationItems(5, 10)).toEqual([1, "...", 4, 5, 6, "...", 10]);
  });
});
