# Historical norm parameter import protocol

## Purpose

Historical calculations must use the norm parameters that were applicable on the calculation date. Merelo must never infer missing historical values from the current norm set.

## Verification gate

A period becomes executable only when every required parameter key has a `verified` record with an official source URL and source locator.

Required keys are defined in `lib/historical-norm-parameter-registry.ts`.

## Import rules

1. Identify the official Expertgroep Alimentatienormen report or attachment for the period.
2. Record the exact table/page/section in `sourceLocator`.
3. Record each required parameter independently.
4. Do not interpolate values between reports unless the official source explicitly requires it.
5. Do not use a later/current value as a historical fallback.
6. If a required value cannot be verified, leave the parameter `pending` and return `REVIEW_REQUIRED`.
7. Only after the complete set is verified may the period be connected to the calculation engine.

## Release gate

Historical calculation support is not production-ready merely because the period catalogue exists. The complete parameter set, calculation adapter, regression tests, and CI must all be green before activation.
