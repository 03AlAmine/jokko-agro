import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VoiceAssistantComponent } from '../voice-assistant/voice-assistant';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, VoiceAssistantComponent], // Ajouter VoiceAssistantComponent ici
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.css']
})
export class HomePageComponent {}
