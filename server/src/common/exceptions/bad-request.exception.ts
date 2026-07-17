import { AppException } from "./app.exception";
import { HttpStatus } from "../constants";

export class BadRequestException extends AppException {
  constructor(message = "Bad Request", errors?: unknown) {
    super(message, HttpStatus.BAD_REQUEST, errors);
  }
}
