/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class Insurance extends Contract {
    var currentClaimNum = 0;

    async initLedger(ctx) {
        console.info('START: Initialize Ledger');
        console.info('END: Initialize Ledger');
    }

    async fileClaim(ctx, claimNum, name, licencePlate, nameOther, licencePlateOther) {
        console.info('START: Create Claim');
        const claim = {
            state: 0,
            name,
            licencePlate,
            nameOther,
            licencePlateOther,
            claimAdjuster: '',
            proofOfLoss: '',
            amountToPay: null,
            amountToPayOther: null
        }
        await ctx.stub.putState(claimNum, Buffer.from(JSON.stringify(claim)));
        console.info('STOP: Create Claim');
    }

    async assignClaimAdjuster(ctx, claimNum, claimAdjusterName) {
        console.info('START: assignClaimAdjuster');
        const claimAsString = await self.checkStatus(claimNum);
        var claim = JSON.parse(claimAsString);
        if (claim.state > 1) {
            throw new Error(`Cannot assign a new claim adjuster for ${claimNum}`);
        }
        claim.state = 1;
        claim.claimAdjuster = claimAdjusterName;
        await ctx.stub.putState(claimNum, Buffer.from(JSON.stringify(claim)));
        console.info('END: assignClaimAdjuster');
    }

    async completeAssessment(ctx, claimNum, amountToPay, amountToPayOther) {
        console.info('START: completeAssessment');
        const claimAsString = await self.checkStatus(claimNum);
        var claim = JSON.parse(claimAsString);
        if (claim.state != 1) {
            throw new Error(`${claimNum} is not under assessment`);
        }
        claim.state = 2;
        claim.amountToPay = amountToPay;
        claim.amountToPayOther = amountToPayOther;
        await ctx.stub.putState(claimNum, Buffer.from(JSON.stringify(claim)));
        console.info('END: completeAssessment');
    }

    async agreeOnAssessment(ctx, claimNum, agreement) {
        console.info('START: agreeOnAssessment');
        const claimAsString = await self.checkStatus(claimNum);
        var claim = JSON.parse(claimAsString);
        if (claim.state < 2) {
            throw new Error(`${claimNum} is not assessed yet`);
        } elif (claim.state > 2) {
            throw new Error(`Agreed on loss assessment for ${claimNum} already`);
        }
        if (agreement) {
            claim.state = 3;
        } else {
            claim.state = 1;
        }
        await ctx.stub.putState(claimNum, Buffer.from(JSON.stringify(claim)));
        console.info('END: agreeOnAssessment');
    }

    async submitProofOfLoss(ctx, claimNum, proofOfLoss) {
        console.info('START: submitProofOfLoss');
        const claimAsString = await self.checkStatus(claimNum);
        var claim = JSON.parse(claimAsString);
        if (claim.state != 3) {
            throw new Error(`${claimNum} does not need Proof of Loss yet`);
        }
        claim.state = 4;
        claim.proofOfLoss = proofOfLoss;
        await ctx.stub.putState(claimNum, Buffer.from(JSON.stringify(claim)));
        console.info('END: submitProofOfLoss');
    }

    async validProofOfLoss(ctx, claimNum, valid) {
        console.info('START: validProofOfLoss');
        const claimAsString = await self.checkStatus(claimNum);
        var claim = JSON.parse(claimAsString);
        if (claim.state != 4) {
            throw new Error(`Proof of Loss for ${claimNum} is not submitted yet`);
        }
        if (valid) {
            claim.state = 5;
        } else {
            claim.state = 3;
        }
        await ctx.stub.putState(claimNum, Buffer.from(JSON.stringify(claim)));
        console.info('END: validProofOfLoss');
    }

    async checkStatus(claimNum) {
        const claimAsBytes = await ctx.stub.getState(claimNum);
        if (!claimAsBytes || claimAsBytes.length === 0) {
            throw new Error(`${claimNum} does not exist`);
        }
        console.log(claimAsBytes.toString());
        return claimAsBytes.toString();
    }
}

module.exports = Insurance;
