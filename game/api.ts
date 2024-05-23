import * as Http from '@effect/platform/HttpClient'
import { Effect, Schedule } from 'effect'
import { Claim, Login } from './models.ts'

const UA = `Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148`

export const login = (tgWebAppData: string) =>
	Http.request
		.post('https://clicker.game-bomb.ru/authorize')
		.pipe(
			Http.request.setHeader('User-Agent', UA),
			Http.request.setHeader('Content-Type', 'application/x-www-form-urlencoded'),
			Http.request.textBody(tgWebAppData),
			Http.client.fetchOk,
			Effect.andThen(Http.response.schemaBodyJson(Login)),
			Effect.scoped
		)

export const claim = (accessToken: string) =>
	Http.request
		.post('https://clicker.game-bomb.ru/claim')
		.pipe(
			Http.request.setHeader('User-Agent', UA),
			Http.request.setHeader('Content-Type', 'application/json'),
			Http.request.setHeader('X-Api-Key', accessToken),
			Http.client.fetchOk,
			Effect.andThen(Http.response.schemaBodyJson(Claim)),
			Effect.retry(Schedule.recurs(3)),
			Effect.scoped
		)
