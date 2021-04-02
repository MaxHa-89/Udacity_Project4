/**
 * Lambda function to generate an upload url
 */
import 'source-map-support/register'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  APIGatewayProxyHandler
} from 'aws-lambda'
import { createLogger } from '../../utils/logger'
import { parseUserId } from '../../auth/utils'
import { generateUploadUrl } from '../../services/todos'

const logger = createLogger('generateUploadUrl')

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('Processing generate upload url event', {
    event
  })

  const todoId = event.pathParameters.todoId
  const userId = parseUserId(event.headers.Authorization)

  try {
    const generatedUploadUrl = await generateUploadUrl(userId, todoId)
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        uploadUrl: generatedUploadUrl
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error })
    }
  }
}
