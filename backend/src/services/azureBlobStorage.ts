import path from 'path';
import { randomUUID } from 'crypto';
import {
  BlobSASPermissions,
  BlobServiceClient,
  SASProtocol,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';

export interface ResumeUploadInput {
  applicationId: string;
  fileBuffer: Buffer;
  originalName: string;
  contentType?: string;
}

export interface ResumeUploadResult {
  blobName: string;
  blobUrl: string;
  accessUrl: string;
}

const DEFAULT_CONTAINER_NAME = 'resumes';
const DEFAULT_SAS_EXPIRY_MINUTES = 60;

export class AzureBlobStorageService {
  private static blobServiceClient: BlobServiceClient | null = null;
  private static containerInitialized = false;

  private static getConnectionString(): string {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('Azure storage is not configured. Missing AZURE_STORAGE_CONNECTION_STRING');
    }
    return connectionString;
  }

  private static getContainerName(): string {
    return process.env.AZURE_STORAGE_CONTAINER_NAME || DEFAULT_CONTAINER_NAME;
  }

  private static getBlobServiceClient(): BlobServiceClient {
    if (!this.blobServiceClient) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(this.getConnectionString());
    }
    return this.blobServiceClient;
  }

  private static isPublicReadEnabled(): boolean {
    return process.env.AZURE_STORAGE_PUBLIC_READ === 'true';
  }

  private static getSasExpiryMinutes(): number {
    const raw = Number(process.env.AZURE_BLOB_URL_EXPIRY_MINUTES || DEFAULT_SAS_EXPIRY_MINUTES);
    if (Number.isNaN(raw) || raw <= 0) {
      return DEFAULT_SAS_EXPIRY_MINUTES;
    }
    return Math.min(raw, 24 * 60);
  }

  private static parseConnectionValue(key: string): string | null {
    const connectionString = this.getConnectionString();
    const pairs = connectionString.split(';');

    for (const pair of pairs) {
      const separatorIndex = pair.indexOf('=');
      if (separatorIndex <= 0) {
        continue;
      }

      const k = pair.slice(0, separatorIndex).trim();
      const v = pair.slice(separatorIndex + 1).trim();
      if (k === key && v) {
        return v;
      }
    }

    return null;
  }

  private static getSharedKeyCredential(): StorageSharedKeyCredential | null {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || this.parseConnectionValue('AccountName');
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || this.parseConnectionValue('AccountKey');

    if (!accountName || !accountKey) {
      return null;
    }

    return new StorageSharedKeyCredential(accountName, accountKey);
  }

  static async ensureContainer(): Promise<void> {
    if (this.containerInitialized) {
      return;
    }

    const client = this.getBlobServiceClient().getContainerClient(this.getContainerName());
    if (this.isPublicReadEnabled()) {
      await client.createIfNotExists({ access: 'blob' });
    } else {
      await client.createIfNotExists();
    }

    this.containerInitialized = true;
  }

  private static getSafeExtension(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase();
    if (ext && ext.length <= 10) {
      return ext;
    }
    return '.bin';
  }

  private static resolveContentType(originalName: string, contentType?: string): string {
    if (contentType && contentType !== 'application/octet-stream') {
      return contentType;
    }

    const ext = path.extname(originalName).toLowerCase();
    if (ext === '.pdf') {
      return 'application/pdf';
    }
    if (ext === '.doc') {
      return 'application/msword';
    }
    if (ext === '.docx') {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    return 'application/octet-stream';
  }

  private static buildBlobName(applicationId: string, originalName: string): string {
    const ext = this.getSafeExtension(originalName);
    return `${applicationId}/${Date.now()}-${randomUUID()}${ext}`;
  }

  static async uploadResume(input: ResumeUploadInput): Promise<ResumeUploadResult> {
    await this.ensureContainer();

    const blobName = this.buildBlobName(input.applicationId, input.originalName);
    const containerClient = this.getBlobServiceClient().getContainerClient(this.getContainerName());
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(input.fileBuffer, {
      blobHTTPHeaders: {
        blobContentType: this.resolveContentType(input.originalName, input.contentType),
      },
      metadata: {
        applicationid: input.applicationId,
        originalfilename: path.basename(input.originalName).slice(0, 100),
        uploadedat: new Date().toISOString(),
      },
    });

    const blobUrl = blockBlobClient.url;
    const accessUrl = await this.getReadUrl(blobName);

    return {
      blobName,
      blobUrl,
      accessUrl,
    };
  }

  static async getReadUrl(blobName: string): Promise<string> {
    const containerClient = this.getBlobServiceClient().getContainerClient(this.getContainerName());
    const blobClient = containerClient.getBlobClient(blobName);

    if (this.isPublicReadEnabled()) {
      return blobClient.url;
    }

    const sharedKey = this.getSharedKeyCredential();
    if (!sharedKey) {
      return blobClient.url;
    }

    const expiresOn = new Date(Date.now() + this.getSasExpiryMinutes() * 60 * 1000);
    const startsOn = new Date(Date.now() - 5 * 60 * 1000);

    const sas = generateBlobSASQueryParameters(
      {
        containerName: this.getContainerName(),
        blobName,
        permissions: BlobSASPermissions.parse('r'),
        startsOn,
        expiresOn,
        protocol: SASProtocol.Https,
      },
      sharedKey
    ).toString();

    return `${blobClient.url}?${sas}`;
  }

  private static extractBlobNameFromUrl(storedUrl: string): string | null {
    try {
      const parsedUrl = new URL(storedUrl);
      const pathSegments = parsedUrl.pathname.replace(/^\//, '').split('/');
      if (pathSegments.length < 2) {
        return null;
      }

      const containerName = pathSegments[0];
      if (containerName !== this.getContainerName()) {
        return null;
      }

      return decodeURIComponent(pathSegments.slice(1).join('/'));
    } catch {
      return null;
    }
  }

  static async getReadUrlFromStoredUrl(storedUrl: string): Promise<string> {
    if (!storedUrl.startsWith('http://') && !storedUrl.startsWith('https://')) {
      return storedUrl;
    }

    const blobName = this.extractBlobNameFromUrl(storedUrl);
    if (!blobName) {
      return storedUrl;
    }

    return this.getReadUrl(blobName);
  }

  static async deleteBlob(blobName: string): Promise<void> {
    await this.ensureContainer();
    const containerClient = this.getBlobServiceClient().getContainerClient(this.getContainerName());
    await containerClient.deleteBlob(blobName, { deleteSnapshots: 'include' });
  }
}
