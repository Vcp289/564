"use strict";
// LuckyNumber V7.20.71 — Pro Core / immutable production policy.
// Split from app-r42.js so ranking/UI cleanup cannot silently alter stable math.
const SAFE_POLISH_FREEZE = Object.freeze({
  comboMaxGap: 2.0,
  comboConsensusBonus: 20,
  comboSingleScale: 0.80,
  profileRankWeights: Object.freeze({hit:0.62, confidence:0.23, samples:0.12, freshness:0.03}),
  profileTieBreak: Object.freeze(["trustedRate","trustedSamples","confidence","profileId"])
});
const AI_ROLE_GROUPS = Object.freeze({main:Object.freeze(["x3","p19","gl","aiL"]),support:Object.freeze([])});
const AI_STANDARD_VISIBLE_ENGINES = Object.freeze(["x3","p19","gl","aiL"]);
const AI_STANDARD_VISIBLE_LABELS = Object.freeze({x3:"X3",p19:"P19",gl:"AI GL",aiL:"AI L"});
const SCORE_TERMS = Object.freeze({rank:"Rank Score",hit:"Trusted Hit Rate",confidence:"AI Confidence"});
const PRO_RANKER_POLICY = Object.freeze({candidatePoolSize:5,transitionMinDraws:3,transitionMaxDraws:5,strictPriorOnly:true});
