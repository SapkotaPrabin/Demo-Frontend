import { expect, test } from "@rstest/core";
import {
  getContactNumberError,
  getEmailError,
  isValidContactNumber,
  isValidEmail,
} from "../src/demo/business/fieldValidation";

test("contact numbers must contain exactly 10 digits", () => {
  expect(isValidContactNumber("123456789")).toBe(false);
  expect(isValidContactNumber("1234567890")).toBe(true);
  expect(isValidContactNumber("12345678901")).toBe(false);
  expect(isValidContactNumber("12345abc90")).toBe(false);
  expect(getContactNumberError("", true)).toBe("Contact number is required.");
});

test("emails must use a local part, domain, and top-level domain", () => {
  expect(isValidEmail("person@example.com")).toBe(true);
  expect(isValidEmail("person+tag@mail.example.co")).toBe(true);
  expect(isValidEmail("person@example")).toBe(false);
  expect(isValidEmail("person@.com")).toBe(false);
  expect(isValidEmail("person@example.c")).toBe(false);
  expect(isValidEmail("person name@example.com")).toBe(false);
  expect(getEmailError("", true)).toBe("Email address is required.");
});
