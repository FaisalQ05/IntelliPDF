import { AppException } from "./app.exception";
import { HttpStatus } from "../constants";

export class NotFoundException extends AppException {
  constructor(message = "Resource not found") {
    super(message, HttpStatus.NOT_FOUND);
  }
}
