/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getDavNameSpaces, getDavProperties } from '@nextcloud/files'
import { client } from './WebdavClient'
import { genFileInfo, type FileInfo } from '../utils/fileUtils'
import type { FileStat, ResponseDataDetailed } from 'webdav'
import logger from './logger.js'

/**
 * Retrieve the files list
 * @param path - Directory path to fetch contents from
 * @param options - Additional options for the request
 */
export default async function(path: string, options = {}): Promise<FileInfo[]> {
	logger.debug('[FileList] Fetching directory contents', { path })

	try {
		const response = await client.getDirectoryContents(path, Object.assign({
			data: `<?xml version="1.0"?>
				<d:propfind ${getDavNameSpaces()}>
					<d:prop>
						<oc:tags />
						${getDavProperties()}
					</d:prop>
				</d:propfind>`,
			details: true,
		}, options)) as ResponseDataDetailed<FileStat[]>

		const fileInfos = response.data.map(genFileInfo)

		logger.debug('[FileList] Directory contents fetched successfully', {
			path,
			fileCount: fileInfos.length,
			files: fileInfos.slice(0, 10).map(f => f.basename), // Log first 10 files
		})

		return fileInfos
	} catch (error) {
		// Don't log AbortError as it's expected when cancelling requests
		if ((error as Error).name !== 'AbortError') {
			logger.error('[FileList] Failed to fetch directory contents', { path, error })
		}
		throw error
	}
}
