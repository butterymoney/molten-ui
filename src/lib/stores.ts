import {writable} from 'svelte/store';
import type { ethers } from 'ethers';

export const signer = writable<ethers.providers.JsonRpcSigner | null>();