import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { AppInitService } from './services/app-init.service';

export function initializeApp(appInitService: AppInitService) {
  return (): Promise<void> => {
    return appInitService.init();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    AppInitService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AppInitService],
      multi: true
    }
  ]
};
