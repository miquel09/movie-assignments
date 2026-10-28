import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { Movie } from './movies/movie.interface';
import { MoviesComponent } from './movies/movies.component';

@Component({
    selector: 'app-root',
    imports: [MoviesComponent],
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = signal('Movies');
}
