import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getUser(id: string) {
    return { id };
  }
}
