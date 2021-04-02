import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import * as uuid from 'uuid'

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('DatabaseController')
const s3 = new AWS.S3({
  signatureVersion: 'v4'
})
const imagesS3Bucket = process.env.IMAGES_S3_BUCKET
const signedUrlExpiration = process.env.SIGNED_URL_EXPIRATION

export class DatabaseController {
  constructor(
    private readonly dynamoDBClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly todosTableSecIndex = process.env.TODOS_TABLE_SEC_INDEX
  ) {}

  /**
   * Get todo by user id
   * @param userId the user id
   * @returns a json array with the todos
   */
  public async getTodos(userId: string): Promise<TodoItem[]> {
    const queryParams = {
      TableName: this.todosTable,
      IndexName: this.todosTableSecIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };

    logger.info('Querying the database with params:', {
      queryParams
    });

    const queryResult = await this.dynamoDBClient.query(queryParams).promise();

    logger.info('Result:', {
      result: queryResult
    });

    const items = queryResult.Items;
    return items as TodoItem[];
  }

  /**
   * Update todo by use id
   * @param userId
   * @param todoId
   * @param updatedTodo json with updated payload
   */
  async updateTodo(
    userId: string,
    todoId: string,
    updatedTodo: UpdateTodoRequest
  ) {
    var params = {
      TableName: this.todosTable,
      Key: {
        userId: userId,
        todoId: todoId
      },
      UpdateExpression: 'set #todoName = :n, dueDate=:dd, done=:d',
      ExpressionAttributeValues: {
        ':n': updatedTodo.name,
        ':dd': updatedTodo.dueDate,
        ':d': updatedTodo.done
      },
      ExpressionAttributeNames: {
        '#todoName': 'name'
      },
      ReturnValues: 'UPDATED_NEW'
    };
    logger.info('Parameter for the update operation', {
      params
    });

    const updateResult = await this.dynamoDBClient.update(params).promise()
    logger.info('Update Item succeed', {
      result: updateResult
    });
  }

  /**
   * Create todo by user id
   * @param userId
   * @param todoRequest json with payload for new todo entry
   * @returns json with newly created payload
   */
  async createTodo(
    userId: string,
    todoRequest: CreateTodoRequest
  ): Promise<TodoItem> {
    const itemId = uuid.v4()
    const newTodo: TodoItem = {
      todoId: itemId,
      userId: userId,
      createdAt: new Date().toISOString(),
      done: false,
      ...todoRequest
    };

    logger.info('New todo object', {
      newTodo
    });

    const createResult = await this.dynamoDBClient
      .put({
        TableName: this.todosTable,
        Item: newTodo
      })
      .promise();

    logger.info('Create Item succeed', {
      result: createResult
    });

    return newTodo;
  }

  /**
   * Delete todo by user id
   * @param userId
   * @param todoId
   */
  async deleteTodo(userId: string, todoId: string) {
    var deletedTodo = {
      TableName: this.todosTable,
      Key: {
        userId: userId,
        todoId: todoId
      }
    }
    logger.info('Parameter for the delete operation', {
      params: deletedTodo
    })

    const result = await this.dynamoDBClient.delete(deletedTodo).promise()
    logger.info('Delete Item succeed', {
      result
    })
  }

  /**
   * Generates a url to add an image to an existing todo item
   * @param todoId
   * @returns upload url
   */
  async getUploadUrl(todoId: string) {
    return s3.getSignedUrl('putObject', {
      Bucket: imagesS3Bucket,
      Key: todoId,
      Expires: signedUrlExpiration
    })
  }

  /**
   * Updates image url by user id and todo id
   * @param userId
   * @param todoId
   */
  async updateAttachmentUrl(userId: string, todoId: string) {
    const attachmentUrl = `https://${imagesS3Bucket}.s3.amazonaws.com/${todoId}`
    var updatedAttachment = {
      TableName: this.todosTable,
      Key: {
        userId: userId,
        todoId: todoId
      },
      UpdateExpression: 'set attachmentUrl = :au',
      ExpressionAttributeValues: {
        ':au': attachmentUrl
      },
      ReturnValues: 'UPDATED_NEW'
    }
    logger.info('Parameter for the update operation', {
      params: updatedAttachment
    })

    const result = await this.dynamoDBClient.update(updatedAttachment).promise()
    logger.info('Update Item succeed', {
      result
    })
  }
}
