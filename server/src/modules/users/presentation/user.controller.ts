import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../../../common/helpers";
import { UserService } from "../application/user.service";
import { Messages } from "../../../common/constants";

export class UserController {
  constructor(private readonly userService: UserService) {}

  getUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await this.userService.getUsers();
    sendSuccess(res, Messages.USER.ALL_FETCHED, users);
  });
}
