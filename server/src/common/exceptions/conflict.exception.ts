import { AppException } from "./app.exception";
import { HttpStatus } from "../constants";

export class ConflictException extends AppException {
  constructor(message = "Conflict", errors?: unknown) {
    super(message, HttpStatus.CONFLICT, errors);
  }
}
