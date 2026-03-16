import {Composition} from 'remotion';
import {LongestSubstringComposition} from './compositions/LongestSubstring';
import {LongestPalindromicSubstringComposition} from './compositions/LongestPalindromicSubstring';
import {ContainerWithMostWaterComposition} from './compositions/ContainerWithMostWater';
import {ThreeSumComposition} from './compositions/ThreeSum';
import {TrappingRainWaterComposition} from './compositions/TrappingRainWater';
import {LRUCacheComposition} from './compositions/LRUCache';
import {LongestConsecutiveSequenceComposition} from './compositions/LongestConsecutiveSequence';
import {GroupAnagramsComposition} from './compositions/GroupAnagrams';
import {GenerateParenthesesComposition} from './compositions/GenerateParentheses';
import {MergeSortedArrayComposition} from './compositions/MergeSortedArray';
import {SubarraySumEqualsKComposition} from './compositions/SubarraySumEqualsK';
import {NumberOfIslandsComposition} from './compositions/NumberOfIslands';
import {ClimbingStairsComposition} from './compositions/ClimbingStairs';
import {RemoveElementComposition} from './compositions/RemoveElement';
import {IntersectionComposition} from './compositions/Intersection';
import {MergeIntervalsComposition} from './compositions/MergeIntervals';
import {MergeSortedListsComposition} from './compositions/MergeSortedLists';
import {PalindromePartitioningComposition} from './compositions/PalindromePartitioning';
import {SortListComposition} from './compositions/SortList';
import {SearchRotatedSortedArrayComposition} from './compositions/SearchRotatedSortedArray';
import {BestTimeStockComposition} from './compositions/BestTimeStock';
import {GreatestSumComposition} from './compositions/GreatestSum';
import {AtoiComposition} from './compositions/Atoi';
import {RotateImageComposition} from './compositions/RotateImage';
import {FindDuplicateComposition} from './compositions/FindDuplicate';
import {KthLargestComposition} from './compositions/KthLargest';
import './style.css';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="LongestSubstring"
				component={LongestSubstringComposition}
				durationInFrames={600} // 13 steps * 1.5s * 30fps = 585
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="LongestPalindromicSubstring"
				component={LongestPalindromicSubstringComposition}
				durationInFrames={300}
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="ContainerWithMostWater"
				component={ContainerWithMostWaterComposition}
				durationInFrames={500}
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="ThreeSum"
				component={ThreeSumComposition}
				durationInFrames={500}
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="TrappingRainWater"
				component={TrappingRainWaterComposition}
				durationInFrames={600}
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="LRUCache"
				component={LRUCacheComposition}
				durationInFrames={600}
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="LongestConsecutiveSequence"
				component={LongestConsecutiveSequenceComposition}
				durationInFrames={800} // Longer duration for more steps
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="GroupAnagrams"
				component={GroupAnagramsComposition}
				durationInFrames={800}
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="GenerateParentheses"
				component={GenerateParenthesesComposition}
				durationInFrames={1500} // Long duration for DFS traversal
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="MergeSortedArray"
				component={MergeSortedArrayComposition}
				durationInFrames={600}
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="SubarraySumEqualsK"
				component={SubarraySumEqualsKComposition}
				durationInFrames={660} // 11 steps * 60 frames (2 sec) = 660
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="NumberOfIslands"
				component={NumberOfIslandsComposition}
				durationInFrames={900}
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="ClimbingStairs"
				component={ClimbingStairsComposition}
				durationInFrames={660} // (2 init + 4*2 calc + 1 final) * 60 = ~11 steps * 60 = 660
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="RemoveElement"
				component={RemoveElementComposition}
				durationInFrames={1200} // ~20 steps * 60 = 1200
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="Intersection"
				component={IntersectionComposition}
				durationInFrames={900} // ~15 steps * 60 = 900
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="MergeIntervals"
				component={MergeIntervalsComposition}
				durationInFrames={600} // ~10 steps * 60 = 600
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="MergeSortedLists"
				component={MergeSortedListsComposition}
				durationInFrames={900}
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="PalindromePartitioning"
				component={PalindromePartitioningComposition}
				durationInFrames={1200} // Backtracking can have many steps
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="SortList"
				component={SortListComposition}
				durationInFrames={600} // ~10 steps * 60 = 600
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="SearchRotatedSortedArray"
				component={SearchRotatedSortedArrayComposition}
				durationInFrames={600} // ~10 steps * 60 = 600
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="BestTimeStock"
				component={BestTimeStockComposition}
				durationInFrames={600} // ~10 steps
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="GreatestSum"
				component={GreatestSumComposition}
				durationInFrames={360} // 5 steps * 60 = 300
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="Atoi"
				component={AtoiComposition}
				durationInFrames={450} // ~7 chars * 60 = 420
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="RotateImage"
				component={RotateImageComposition}
				durationInFrames={600} // ~10 steps * 60 = 600
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="FindDuplicate"
				component={FindDuplicateComposition}
				durationInFrames={600} // ~10 steps * 60 = 600
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="KthLargest"
				component={KthLargestComposition}
				durationInFrames={600} // ~10 steps * 60 = 600
				fps={30}
				width={1280}
				height={720}
			/>
		</>
	);
};
