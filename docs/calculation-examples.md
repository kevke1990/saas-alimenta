# Audited calculation examples

## Example A — 2026

Inputs from the existing Alimenta regression scenario:
- historical NBGI: €5,000
- need: €680 for one child in the 2026 table
- parent A NBI: €3,350
- parent B NBI: €2,181 + €716 KGB

Capacity:
- parent A: 70% × [3,350 − (0.30 × 3,350 + 1,365)] = €686
- parent B: 70% × [2,897 − (0.30 × 2,897 + 1,365)] ≈ €464
- combined ≈ €1,150

Because combined capacity exceeds need, the need is allocated by capacity ratio. The 15% care discount is **15% × €680 = €102**, not 15% of the paying parent's allocated share.

## Example B — insufficient capacity

The official rule is separate from the sufficient-capacity scenario. The care discount is first determined from the relevant child need/eigen-share. The combined shortfall then reduces the discount by half of the shortfall when the shortfall is less than twice the applicable care discount. If the shortfall is at least twice the applicable care discount, the discount is not verzilverbaar and the payer uses the full applicable capacity.

## Mediator 2024 scenarios

The repository now contains the official 2024 norm data, but the production calculator still needs an explicit historical-period input and NormSet selection before these mediator cases can be claimed as reproduced. This is intentionally left visible rather than silently applying 2026 rules to a 2024 case.
