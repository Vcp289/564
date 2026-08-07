LuckyNumber V6.4.8

Update scope:
- Fix AI-L candidate deletion bug: learned AI-L is retained for History/backtest even when not yet eligible for activation.
- Master AI uses AI-L only when AI-L passes the existing eligibility gate; unapproved candidates cannot affect Master AI.
- Calculate remains on Original unless the user explicitly activates an eligible AI-L.
- One-time safe recovery creates a missing AI-L candidate when AI/History is opened and >= 8 usable samples already exist.
- Existing +5% eligibility threshold, Classic formula, Independent AI, History data, Daily Tables, backup schema and icons are unchanged.
- Includes all V6.4.7 fast-navigation and 365 Home Screen icon updates.
