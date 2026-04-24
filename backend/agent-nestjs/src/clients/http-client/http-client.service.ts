import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HttpClientService {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  public async GetUrl(location: string, url: string): Promise<unknown> {
    const normalizedUrl = this.BuildUrl(location, url);
    const response = await firstValueFrom(this.httpService.get(normalizedUrl));
    return response.data;
  }

  public async PostUrl(
    location: string,
    url: string,
    body: Record<string, unknown>,
    headers: Record<string, string>,
  ): Promise<unknown> {
    const normalizedUrl = this.BuildUrl(location, url);
    const response = await firstValueFrom(
      this.httpService.post(normalizedUrl, body, { headers, timeout: 4 * 1000 }),
    );
    return response.data;
  }

  private BuildUrl(baseUrl: string, pathOrUrl: string): string {
    if (/^https?:\/\//i.test(pathOrUrl) || !baseUrl) {
      return pathOrUrl;
    }

    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
    const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    return `${normalizedBaseUrl}${normalizedPath}`;
  }
}
