// This API endpoint returns example ETH price data for the app.
export default function handler(req, res) {
  res.status(200).json({
    prices: [
      [Date.now() - 6*24*60*60*1000, 3800],
      [Date.now() - 5*24*60*60*1000, 3850],
      [Date.now() - 4*24*60*60*1000, 3900],
      [Date.now() - 3*24*60*60*1000, 3950],
      [Date.now() - 2*24*60*60*1000, 4000],
      [Date.now() - 1*24*60*60*1000, 4100],
      [Date.now(), 4200]
    ],
    currentPrice: 4200
  });
}
