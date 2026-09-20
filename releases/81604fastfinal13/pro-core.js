"use strict";
const SAFE_POLISH_FREEZE=Object.freeze({
comboMaxGap:2.0,
comboConsensusBonus:20,
comboSingleScale:0.80,
profileRankWeights:Object.freeze({hit:0.60,confidence:0.15,samples:0.20,freshness:0.05}),
profileTieBreak:Object.freeze(["bayesianRate","trustedSamples","trustedRate","confidence","profileId"])
});
const AI_STANDARD_VISIBLE_ENGINES=Object.freeze(["x3","p19","gl","aiL"]);
const SCORE_TERMS=Object.freeze({rank:"Rank Score",hit:"Trusted Hit Rate",confidence:"AI Confidence"});
const PRO_RANKER_POLICY=Object.freeze({candidatePoolSize:5,transitionMinDraws:3,transitionMaxDraws:5,strictPriorOnly:true});
