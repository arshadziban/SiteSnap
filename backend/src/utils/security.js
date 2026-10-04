// Small security helpers shared across services.
import { v4 as uuidv4, validate as validateUuid } from "uuid";

export function newId() {
  return uuidv4();
}

export function isValidUuid(value) {
  return typeof value === "string" && validateUuid(value);
}
