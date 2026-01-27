import { Controller, Get } from "@nestjs/common";
import { Public } from "./common/decorators/public.decorator";

@Public()
@Controller()
export class AppController {
  @Get()
  getHello() {
    return { message: 'Hireme Server is running!' };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Hireme-server'
    };
  }

  @Get('ping')
  getPing() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Hireme-server'
    };
  }
} 
