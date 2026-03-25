import {registerRoot, Composition} from 'remotion';
import React from 'react';
import {FindAllAnagramsComposition} from './compositions/FindAllAnagrams';
import {MinSubArrayLenComposition} from './compositions/MinSubArrayLen';
import {MoveZeroesComposition} from './compositions/MoveZeroes';
import {DailyTemperaturesComposition} from './compositions/DailyTemperatures';
import {ShuffleArrayComposition} from './compositions/ShuffleArray';
import {PalindromePartitioningComposition} from './compositions/PalindromePartitioning';
import {RestoreIpAddressesComposition} from './compositions/RestoreIpAddresses';
import {
	LRUCacheComposition,
	LRU_CACHE_TOTAL_FRAMES,
} from './compositions/LRUCache';
import {
	TwoSumComposition,
	TWO_SUM_TOTAL_FRAMES,
} from './compositions/TwoSum';
import {
	ImplementTrieComposition,
	IMPLEMENT_TRIE_TOTAL_FRAMES,
} from './compositions/ImplementTrie';
import {
	ZigzagLevelOrderComposition,
	ZIGZAG_LEVEL_ORDER_TOTAL_FRAMES,
} from './compositions/ZigzagLevelOrder';
import {
	SlidingWindowMaxComposition,
	SLIDING_WINDOW_MAX_TOTAL_FRAMES,
} from './compositions/SlidingWindowMax';
import {ZigzagDualStackComposition} from './compositions/ZigzagDualStack';
import {
	ZigzagConversionComposition,
	ZIGZAG_CONVERSION_TOTAL_FRAMES,
} from './compositions/ZigzagConversion';
import {
	RightSideViewComposition,
	RIGHT_SIDE_VIEW_TOTAL_FRAMES,
} from './compositions/RightSideView';
import {
	LFUCacheComposition,
	LFU_CACHE_TOTAL_FRAMES,
} from './compositions/LFUCache';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="FindAllAnagrams"
				component={FindAllAnagramsComposition}
				durationInFrames={300}
				fps={30}
				width={1920}
				height={1080}
			/>
            <Composition
				id="MinSubArrayLen"
				component={MinSubArrayLenComposition}
				durationInFrames={300}
				fps={30}
				width={1920}
				height={1080}
			/>
            <Composition
				id="MoveZeroes"
				component={MoveZeroesComposition}
				durationInFrames={300}
				fps={30}
				width={1920}
				height={1080}
			/>


            <Composition
				id="DailyTemperatures"
				component={DailyTemperaturesComposition}
				durationInFrames={300} // May need adjustment based on steps count check?
				fps={30}
				width={1920}
				height={1080}
			/>
            <Composition
				id="ShuffleArray"
				component={ShuffleArrayComposition}
				durationInFrames={300}
				fps={30}
				width={1920}
				height={1080}
			/>
			<Composition
				id="PalindromePartitioning"
				component={PalindromePartitioningComposition}
				durationInFrames={1200}
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="RestoreIpAddresses"
				component={RestoreIpAddressesComposition}
				durationInFrames={900}
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="LRUCache"
				component={LRUCacheComposition}
				durationInFrames={LRU_CACHE_TOTAL_FRAMES}
				fps={30}
				width={1920}
				height={1080}
			/>
			<Composition
				id="TwoSum"
				component={TwoSumComposition}
				durationInFrames={TWO_SUM_TOTAL_FRAMES}
				fps={30}
				width={1920}
				height={1080}
			/>

			<Composition
				id="ImplementTrie"
				component={ImplementTrieComposition}
				durationInFrames={IMPLEMENT_TRIE_TOTAL_FRAMES}
				fps={30}
				width={1920}
				height={1080}
			/>
			<Composition
				id="ZigzagLevelOrder"
				component={ZigzagLevelOrderComposition}
				durationInFrames={ZIGZAG_LEVEL_ORDER_TOTAL_FRAMES}
				fps={30}
				width={1920}
				height={1080}
			/>
			<Composition
				id="SlidingWindowMax"
				component={SlidingWindowMaxComposition}
				durationInFrames={SLIDING_WINDOW_MAX_TOTAL_FRAMES}
				fps={30}
				width={1920}
				height={1080}
			/>
			<Composition
				id="ZigzagDualStack"
				component={ZigzagDualStackComposition}
				durationInFrames={1200}
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="RightSideView"
				component={RightSideViewComposition}
				durationInFrames={RIGHT_SIDE_VIEW_TOTAL_FRAMES}
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="ZigzagConversion"
				component={ZigzagConversionComposition}
				durationInFrames={ZIGZAG_CONVERSION_TOTAL_FRAMES}
				fps={30}
				width={1920}
				height={1080}
			/>
			<Composition
				id="LFUCache"
				component={LFUCacheComposition}
				durationInFrames={LFU_CACHE_TOTAL_FRAMES}
				fps={30}
				width={1920}
				height={1080}
			/>
		</>
	);
};

registerRoot(RemotionRoot);
