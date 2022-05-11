const {
  InvalidSharePostPayload,
  InvalidStudyTypePayload,
} = require("./errors");
const { PostMetric, Metric, sequelize } = require("../../sequelize/models");

function shareMetricManagerFactory(user, post, metric, postMetricRes, action) {
  async function updateMonetaryMetric(post, metric, t) {
    const { informationType } = post;

    const incrementSlab = {
      TRUE: 10,
      PLAUSIBLE: 10,
      FALSE: -4,
      IMPLAUSIBLE: -4,
      WHOLESOME: 0,
    };

    const increment = incrementSlab[informationType];

    if (increment === undefined) throw new Error("Undefined Information Type");

    await Metric.upsert(
      { id: metric.id, user: user.id, points: metric.points + increment },
      { transaction: t }
    );
  }

  async function updateVanityMetric(post, metric, t) {
    const { informationType } = post;

    const incrementSlab = {
      TRUE: 400,
      PLAUSIBLE: 400,
      FALSE: -40,
      IMPLAUSIBLE: -40,
      WHOLESOME: 0,
    };

    const increment = incrementSlab[informationType];

    if (increment === undefined) throw new Error("Undefined Information Type");

    await Metric.upsert(
      { id: metric.id, user: user.id, points: metric.points + increment },
      { transaction: t }
    );
  }

  async function updateMetric() {
    const { type: metricType } = metric;
    try {
      await sequelize.transaction(async (t) => {
        if (metricType === "MONETARY")
          await updateMonetaryMetric(post, metric, t);
        else if (metricType === "VANITY")
          await updateVanityMetric(post, metric, t);
        else throw new InvalidStudyTypePayload();

        await PostMetric.upsert(
          {
            id: postMetricRes ? postMetricRes.id : undefined,
            user: user.id,
            post: post.id,
            name: "SHARE",
            value: "YES",
          },
          { transaction: t }
        );
      });
    } catch (err) {
      throw new InvalidSharePostPayload();
    }
  }
  return {
    updateMetric,
  };
}

module.exports = {
  shareMetricManagerFactory,
};