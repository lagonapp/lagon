import clickhouse from 'lib/clickhouse';
import prisma from 'lib/prisma';
import { stripe } from 'lib/stripe';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).end();
  }

  const token = authorization.split(' ')[1];

  if (token !== process.env.UPDATE_CURRENT_USAGES_SECRET) {
    return res.status(401).end();
  }

  const organizations = await prisma.organization.findMany({
    where: {
      NOT: {
        stripeSubscriptionId: null,
      },
    },
    select: {
      id: true,
      stripeSubscriptionId: true,
    },
  });

  const promises = organizations.map(async organization => {
    if (!organization.stripeSubscriptionId) {
      return;
    }

    const functions = await prisma.function.findMany({
      where: {
        organizationId: organization.id,
      },
      select: {
        id: true,
      },
    });

    const functionsIds = functions.map(({ id }) => id);
    const result = (await clickhouse
      .query(
        `SELECT
    count(*) as requests
  FROM serverless.requests
  WHERE
    function_id IN ('${functionsIds.join("','")}')
  AND
    timestamp >= toStartOfMonth(now())`,
      )
      .toPromise()) as { requests: number }[];

    const requests = result[0]?.requests || 0;

    const subscription = await stripe.subscriptions.retrieve(organization.stripeSubscriptionId);
    const subscriptionItemId = subscription.items.data[1].id;

    await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
      quantity: requests,
      action: 'set',
    });
  });

  await Promise.all(promises);

  res.json({ success: true });
}
