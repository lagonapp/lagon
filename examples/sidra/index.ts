import { Controller, Get, HTTPStatus, Handle, type APIRes } from "sidra";

@Controller()
class MyController {
	@Get()
	get(): APIRes<string> {
		return {
			data: "Hello World",
			message: "Hello World",
			statusCode: HTTPStatus.OK,
		};
	}
}

export const handler = Handle([MyController]);
