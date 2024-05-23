import { BunRuntime } from '@effect/platform-bun'
import chalk from 'chalk'
import { Config, ConfigProvider, Effect, pipe, Schedule } from 'effect'
import { constVoid } from 'effect/Function'
import { claim, login } from './game/api.ts'
import { fmt } from './game/fmt.ts'
import { Telegram } from './telegram/client.ts'

type State = {
	token: string
	energy: number
	balance: number
}

const miner = Effect.gen(function* (_) {
	const client = yield* _(Telegram)
	const peerId = yield* _(client.getPeerId('Shuttle_ton_bot'))

	const webViewResultUrl = yield* _(
		client.requestWebView({
			url: 'https://app.game-bomb.ru/',
			bot: peerId,
			peer: peerId,
		})
	)

	const tgWebAppData = webViewResultUrl.searchParams.get('tgWebAppData')!
	if (!tgWebAppData) {
		return Effect.none
	}

	const state: State = {
		token: '',
		energy: 0,
		balance: 0,
	}

	const sync = Effect.gen(function* (_) {
		const result = yield* login(tgWebAppData)
		state.token = result.access_token
		state.energy = result.energy
		state.balance = result.balance
	})

	const mine = Effect.gen(function* (_) {
		const { balance } = yield* claim(state.token)
		const balanceDiff = balance - state.balance
		state.balance = balance

		console.log(
			chalk.bold(new Date().toLocaleTimeString()),
			'|🪙'.padEnd(4),
			chalk.bold(`${state.balance}`.padEnd(4)),
			chalk.bold[balanceDiff > 0 ? 'green' : 'red'](fmt(balanceDiff).padEnd(4))
		)
	})

	const mineInterval = yield* Config.duration('GAME_MINE_INTERVAL').pipe(Config.withDefault('30 seconds'))
	const syncInterval = yield* Config.duration('GAME_SYNC_INTERVAL').pipe(Config.withDefault('360 seconds'))

	const miner = Effect.repeat(
		mine,
		Schedule.addDelay(Schedule.forever, () => mineInterval)
	)

	const syncer = Effect.repeat(
		sync,
		Schedule.addDelay(Schedule.forever, () => syncInterval)
	)

	yield* sync
	yield* Effect.all([miner, syncer], { concurrency: 'unbounded' })
})

const policy = Schedule.fixed('15 seconds')

const program = Effect.match(miner, {
	onSuccess: constVoid,
	onFailure: (err) => {
		console.error(chalk.bold(new Date().toLocaleTimeString()), '‼️FAILED:', err._tag)
	},
})

pipe(
	Effect.all([Effect.repeat(program, policy), Effect.sync(() => process.stdout.write('\u001Bc\u001B[3J'))], {
		concurrency: 'unbounded',
	}),
	Effect.provide(Telegram.live),
	Effect.withConfigProvider(ConfigProvider.fromEnv()),
	BunRuntime.runMain
)
