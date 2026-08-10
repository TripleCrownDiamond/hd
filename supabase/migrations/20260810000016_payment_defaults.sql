-- Enable bank transfer out of the box.
--
-- The row starts empty (no method configured), which left the checkout with
-- no payment option at all and the order button permanently disabled. This
-- seeds an explicitly marked placeholder account so Überweisung is available
-- immediately. The storefront never shows the placeholder: the confirmation
-- page and the order e-mails fall back to "Kontodaten per E-Mail" while it is
-- set. Replace IBAN and Kontoinhaber with the real account in the admin
-- (/admin/zahlungen) before the shop takes real orders.

update public.payment_settings
set bank_transfer_enabled = true,
    bank_account_holder = coalesce(nullif(bank_account_holder, ''), 'Bitte in der Verwaltung hinterlegen'),
    bank_iban = coalesce(nullif(bank_iban, ''), 'DE00000000000000000000'),
    bank_bic = coalesce(nullif(bank_bic, ''), ''),
    bank_name = coalesce(nullif(bank_name, ''), '')
where id = 1;
