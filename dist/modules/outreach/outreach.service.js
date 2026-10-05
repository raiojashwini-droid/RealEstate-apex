"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOutreachPipeline = void 0;
const prisma_1 = __importDefault(require("../../prisma"));
const mapContactStatusToUI = (status) => {
    switch (status) {
        case 'QUEUED_FOR_OUTREACH':
            return 'Queued for Outreach';
        case 'OUTREACH_SENT':
            return 'Outreach Sent';
        case 'RESPONDED_QUALIFYING':
            return 'Responded/Qualifying';
        case 'NEEDS_HUMAN_TOUCH':
            return 'Needs Human Touch';
        case 'LEAD_CREATED':
            return 'Lead Created';
        case 'NURTURE_30_DAY':
            return 'No Response, In 30-Day Nurture';
        case 'NOT_INTERESTED':
            return 'Not Interested - CLOSED';
        case 'WRONG_NUMBER':
            return 'Wrong Number / Not an Agent - CLOSED';
        case 'OPTED_OUT_DND':
            return 'Opted Out / DND - CLOSED';
        default:
            return status || 'Queued for Outreach';
    }
};
const mapTemperatureToUI = (temp) => {
    if (temp === 'HOT')
        return 'Hot';
    if (temp === 'COLD')
        return 'Cold';
    return 'Warm';
};
const getOutreachPipeline = async () => {
    const contacts = await prisma_1.default.contact.findMany({
        where: {
            deletedAt: null
        },
        include: {
            cadenceEnrollments: { orderBy: { createdAt: 'desc' }, take: 1 },
            conversations: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: { grades: { orderBy: { createdAt: 'desc' }, take: 1 } }
            },
            deals: true
        },
        orderBy: { updatedAt: 'desc' }
    });
    const now = Date.now();
    return contacts.map(c => {
        const cad = c.cadenceEnrollments[0];
        const conv = c.conversations[0];
        const grade = conv?.grades[0];
        // Dynamic Nurture Day Calculation
        const refDate = cad?.cadenceStartAt || c.lastContactedAt || c.createdAt;
        const daysSince = Math.max(1, Math.floor((now - new Date(refDate).getTime()) / (1000 * 60 * 60 * 24)));
        const nurtureDay = c.status === 'QUEUED_FOR_OUTREACH' ? 0 : (((daysSince - 1) % 30) + 1);
        const recycleCount = Math.floor((daysSince - 1) / 30);
        // Dynamic Next Scheduled Touch Calculation
        let nextScheduledTouch = 'Touch 1 Ready';
        const currentTouch = cad ? cad.touchNumber : (c.lastContactedAt ? 1 : 0);
        if (c.status === 'NURTURE_30_DAY') {
            nextScheduledTouch = 'In 30-Day Nurture Loop';
        }
        else if (c.status === 'OPTED_OUT_DND' || c.status === 'NOT_INTERESTED' || c.status === 'WRONG_NUMBER') {
            nextScheduledTouch = 'Opted Out / Closed';
        }
        else if (cad?.nextTouchAt) {
            const nextDate = new Date(cad.nextTouchAt);
            const isPast = nextDate.getTime() <= now;
            nextScheduledTouch = isPast
                ? `Touch ${Math.min(5, currentTouch + 1)} Ready`
                : `Touch ${Math.min(5, currentTouch + 1)} on ${nextDate.toLocaleDateString()}`;
        }
        else if (currentTouch >= 5) {
            nextScheduledTouch = 'In 30-Day Nurture Loop';
        }
        else if (currentTouch > 0) {
            nextScheduledTouch = `Touch ${currentTouch + 1} Ready`;
        }
        return {
            id: c.id,
            name: c.fullName,
            phone: c.mobilePhone || '(Unmapped)',
            brokerage: c.brokerage || 'Unknown Brokerage',
            market: c.market || 'Dallas Metro',
            temperature: mapTemperatureToUI(c.temperature),
            outreachStage: mapContactStatusToUI(c.status),
            status: mapContactStatusToUI(c.status),
            grade: grade?.letterGrade || 'B',
            score: grade?.score || 75,
            sequenceInfo: {
                currentTouch,
                totalTouches: 5,
                recycleCount,
                nurtureDay,
                lastTouchDate: c.lastContactedAt ? c.lastContactedAt.toISOString().split('T')[0] : 'Never',
                nextScheduledTouch,
                channel: 'sms'
            },
            propertyDealIds: c.deals.map(d => d.id)
        };
    });
};
exports.getOutreachPipeline = getOutreachPipeline;
