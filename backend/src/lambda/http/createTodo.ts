/**
 * Lambda function to create a new todo
 */
import 'source-map-support/register'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult
} from 'aws-lambda'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createLogger } from '../../utils/logger'
import { parseUserId } from '../../auth/utils'
import { createTodo } from '../../services/todos'

const logger = createLogger('createTodo')

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('Processing create todo event', {
    event
  })

  const userId = parseUserId(event.headers.Authorization)

  try {
    const todoRequest:CreateTodoRequest = JSON.parse(event.body)
    const createdTodo = await createTodo(userId, todoRequest)
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        item: createdTodo
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
