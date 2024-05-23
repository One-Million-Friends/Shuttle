import { Schema } from '@effect/schema'

export const Login = Schema.Struct({
	id: Schema.Number,
	balance: Schema.Number,
	balance_usd: Schema.Number,
	first_name: Schema.String,
	energy: Schema.Number,
	energy_level: Schema.Number,
	max_energy_level: Schema.Number,
	mine_level: Schema.Number,
	auto_farmer: Schema.Boolean,
	auto_farmer_profit: Schema.Number,
	access_token: Schema.String,
	access_token_expires_at: Schema.DateFromString,
	daily_booster_available_at: Schema.DateFromString,
	referral_count: Schema.Number,
	referral_profit: Schema.Number,
	available_to_mine: Schema.Number,
	last_mine_at: Schema.DateFromString,
})

export const Claim = Schema.Struct({
	balance: Schema.Number,
	last_mine_at: Schema.DateFromString,
})
