import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type StockStep = {
    prices: number[];
    day: number;
    minPrice: number;
    currentProfit: number;
    maxProfit: number;
    action: 'update_min' | 'calc_profit' | 'new_max' | 'skip';
    description: string;
};

interface BestTimeStockVisualizerProps {
    steps: StockStep[];
    title: string;
}

export const BestTimeStockVisualizer: React.FC<BestTimeStockVisualizerProps> = ({
    steps,
    title
}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();

    if (!steps || steps.length === 0) return null;

    const durationPerStep = 2 * fps;
    const currentStepIndex = Math.min(
        Math.floor(frame / durationPerStep),
        steps.length - 1
    );
    const step = steps[currentStepIndex];

    if (!step) return null;

    // Scale
    const maxPrice = Math.max(...step.prices);
    const height = 300;
    const scaleY = (p: number) => (p / (maxPrice + 1)) * height;
    const barWidth = 60;
    const gap = 30;

    return (
        <AbsoluteFill className="bg-gray-900 text-white p-10 flex flex-col items-center" style={{backgroundColor: '#1e1e1e', color: 'white', fontFamily: 'sans-serif'}}>
            {/* Header */}
            <h1 style={{fontSize: 40, marginBottom: 20, textAlign: 'center'}}>{title}</h1>
            
            <div style={{
                flex: 1,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 40
            }}>
                {/* Stats Panel */}
                <div style={{display: 'flex', gap: 60, marginBottom: 20}}>
                    <div style={{textAlign: 'center'}}>
                        <div style={{color: '#aaa', fontSize: 20}}>Min Price</div>
                        <div style={{fontSize: 40, fontWeight: 'bold', color: '#ef5350'}}>
                            {step.minPrice === Infinity ? '-' : step.minPrice}
                        </div>
                    </div>
                    <div style={{textAlign: 'center'}}>
                        <div style={{color: '#aaa', fontSize: 20}}>Max Profit</div>
                        <div style={{fontSize: 40, fontWeight: 'bold', color: '#4caf50'}}>
                            {step.maxProfit}
                        </div>
                    </div>
                     <div style={{textAlign: 'center'}}>
                        <div style={{color: '#aaa', fontSize: 20}}>Current Profit</div>
                        <div style={{fontSize: 40, fontWeight: 'bold', color: '#ffca28'}}>
                            {step.currentProfit >= 0 ? step.currentProfit : '-'}
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div style={{
                    display: 'flex', 
                    alignItems: 'flex-end', 
                    height: height + 50, 
                    borderBottom: '2px solid #555',
                    paddingBottom: 5,
                    position: 'relative'
                }}>
                    {step.prices.map((price, idx) => {
                        const isCurrent = idx === step.day;
                        const isMin = price === step.minPrice && idx <= step.day; // Not exact logic for 'isMin', simplified
                        // Correct logic: is this bar the one that set the minPrice? Hard to say from history without more state.
                        // Visual check: value matches minPrice.
                        
                        let bgColor = '#42a5f5'; // Blue default
                        if (isCurrent) bgColor = '#ffca28'; // Yellow active

                        return (
                            <div key={idx} style={{
                                width: barWidth,
                                height: scaleY(price),
                                backgroundColor: bgColor,
                                marginRight: gap,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderTopLeftRadius: 5, borderTopRightRadius: 5,
                                fontSize: 24, fontWeight: 'bold', color: '#000',
                                position: 'relative'
                            }}>
                                {price}
                                <div style={{position: 'absolute', bottom: -30, color: '#fff', fontSize: 16}}>Day {idx}</div>
                            </div>
                        );
                    })}

                    {/* Min Price Line */}
                    {step.minPrice !== Infinity && (
                        <div style={{
                            position: 'absolute',
                            bottom: 5 + scaleY(step.minPrice),
                            left: 0,
                            width: '100%',
                            height: 2,
                            backgroundColor: '#ef5350',
                            borderTop: '2px dashed #ef5350',
                            opacity: 0.8
                        }}>
                             <div style={{position: 'absolute', right: 0, top: -25, color: '#ef5350', backgroundColor: '#1e1e1e', padding: '0 5px'}}>Min: {step.minPrice}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Description Panel */}
            <div style={{
                marginTop: 20,
                marginBottom: 40,
                backgroundColor: '#333', 
                padding: 20, 
                borderRadius: 10, 
                width: '80%', 
                textAlign: 'center',
                fontSize: 28,
                color: '#fff',
                border: '1px solid #555'
            }}>
                {step.description}
            </div>
        </AbsoluteFill>
    );
};
