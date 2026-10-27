export const CONTACT_NUMBER_PATTERN = /^\d{10}$/;
export const EMAIL_FORMAT_PATTERN = /^[^\s@]+@(?:[^\s@.]+\.)+[^\s@.]{2,}$/;

export const isValidContactNumber = (value: string): boolean =>
  CONTACT_NUMBER_PATTERN.test(value);

export const isValidEmail = (value: string): boolean =>
  EMAIL_FORMAT_PATTERN.test(value);

export function getContactNumberError(value: string, required = false): string {
  if (!value) return required ? "Contact number is required." : "";
  return isValidContactNumber(value) ? "" : "Enter a 10-digit contact number.";
}

export function getEmailError(value: string, required = false): string {
  if (!value) return required ? "Email address is required." : "";
  return isValidEmail(value) ? "" : "Enter a valid email address (name@domain.com).";
}
