# Merelo brand system

## Brand

**Merelo**  
**Alimentatie inzichtelijk.**

Supporting promise:

**Bereken. Begrijp. Spreek af.**

Merelo is the product brand for the existing Alimenta calculation platform. The rebrand changes product presentation and identity; it does not change the calculation engine, norm logic, persistence model, authorization model, API contracts, or database schema.

## Visual identity

- Petrol: `#163C3A`
- Mint: `#63C6B2`
- Background: `#F4F7F5`
- Sand: `#F4F1E8`
- Text: `#17302E`
- Muted: `#60716F`

The logo is an abstract M built from two opposing forms. It intentionally avoids legal clichés such as scales, gavels, courthouse columns, or literal parent/child illustrations.

## Logo assets

- `public/merelo-mark.svg` — app/favicon mark
- `public/merelo-logo.svg` — light full lockup
- `public/merelo-logo-dark.svg` — dark-surface lockup
- `components/Brand.tsx` — canonical React brand component

## Product voice

Use:

- helder
- rustig
- professioneel
- transparant
- controleerbaar
- menselijk

Avoid:

- juridisch jargon as marketing copy
- claims that a calculation is legally binding
- promises about court outcomes
- aggressive sales language
- visual language that suggests a court or law firm

## Technical migration boundary

The following remain technical identifiers for compatibility and should not be renamed as part of this UI rebrand unless a separate migration is planned:

- repository: `saas-alimenta`
- deployment directory: `/opt/saas-alimenta`
- deployment CLI: `alimenta`
- existing engine filenames and imports containing `alimentatie`
- existing API routes and database identifiers

Product-facing identity is **Merelo**.

## Legal / availability note

This repository change is a product-brand implementation, not a trademark clearance. Before public launch, perform a formal Benelux/EU trademark and trade-name search for Merelo and the relevant software/legal-service classes. Also verify the intended domains and social handles.

The existence of unrelated Merelo uses does not by itself determine registrability; similarity, territory, and the relevant goods/services must be assessed.
