import React from 'react';
import {BestTimeStockVisualizer, StockStep} from '../components/BestTimeStockVisualizer';

const prices = [7, 1, 5, 3, 6, 4];

const steps: StockStep[] = [];

// Simulation
let minPrice = Infinity;
let maxProfit = 0;

steps.push({
    prices, day: -1, minPrice, currentProfit: -1, maxProfit,
    action: 'skip', description: "Start: Initial Max Profit = 0, Min Price = Infinity."
});

for (let i = 0; i < prices.length; i++) {
    const price = prices[i];
    
    // Check Update Min
    if (price < minPrice) {
        minPrice = price;
        steps.push({
            prices, day: i, minPrice, currentProfit: -1, maxProfit,
            action: 'update_min', 
            description: `Day ${i}: Price ${price} < Min Price. Update Min Price to ${price}.`
        });
    } else {
        // Calc Profit
        const profit = price - minPrice;
        let desc = `Day ${i}: Price ${price} >= Min Price ${minPrice}. Potential Profit = ${price} - ${minPrice} = ${profit}.`;
        
        if (profit > maxProfit) {
            maxProfit = profit;
            steps.push({
                prices, day: i, minPrice, currentProfit: profit, maxProfit,
                action: 'new_max', 
                description: desc + ` New Max Profit!`
            });
        } else {
            steps.push({
                prices, day: i, minPrice, currentProfit: profit, maxProfit,
                action: 'calc_profit', 
                description: desc + ` Less than Max Profit (${maxProfit}). Ignore.`
            });
        }
    }
}

// Final
steps.push({
    prices, day: prices.length, minPrice, currentProfit: -1, maxProfit,
    action: 'skip', description: `Check Complete. Final Max Profit: ${maxProfit}.`
});

export const BestTimeStockComposition: React.FC = () => {
    return (
        <BestTimeStockVisualizer
            steps={steps}
            title="121. Best Time to Buy and Sell Stock"
        />
    );
};
