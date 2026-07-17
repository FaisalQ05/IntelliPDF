import { AppException } from "./app.exception";
import { HttpStatus } from "../constants";

export class UnauthorizedException extends AppException {
  constructor(message = "Unauthorized") {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}
