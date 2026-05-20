# LutherKing Graphics Vercel Deploy

## Pages

- Public website: `/`
- Client portal: `/client`
- Designer interface: `/designer`
- Owner admin: `/owner-admin`

The designer and owner pages are not linked from the public navigation. This prototype uses passcodes:

- Owner: `lkg-owner-2026`
- Designer: `lkg-designer-2026`

For a real production launch, replace those passcodes with server-side authentication.

## Vercel Setup

1. Push this folder to a GitHub repository.
2. Go to Vercel and import the repository.
3. Leave build command empty.
4. Add these environment variables in Vercel project settings:

```env
PAYSTACK_SECRET_KEY=sk_test_or_live_key_here
PAYSTACK_DESIGNER_SUBACCOUNT_CODE=ACCT_your_designer_or_client_subaccount_code_here
```

`PAYSTACK_DESIGNER_SUBACCOUNT_CODE` enables the 70% receiver side of your payment split. Your main Paystack account keeps the remaining owner share.

## Contact

- Email: lutherkingmultimedia@gmail.com
- WhatsApp/Phone: 0559627349
