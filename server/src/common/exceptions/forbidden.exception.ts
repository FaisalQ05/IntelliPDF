import { AppException } from "./app.exception";
import { HttpStatus } from "../constants";

export class ForbiddenException extends AppException {
  constructor(message = "Forbidden", errors?: unknown) {
    super(message, HttpStatus.FORBIDDEN, errors);
  }
}
