import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { Movie } from './movies/movie.interface';

@Component({
    selector: 'app-root',
    imports: [],
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = signal('App works!');
  movies = signal<Movie[]>([
      {id: 1, name: "de lift", genre: "horror", rating: 4.3},
      {id: 2, name: "Inception", genre: "science fiction", rating: 8.8},
      {id: 3, name: "The Godfather", genre: "crime", rating: 9.2},
      {id: 4, name: "Spirited Away", genre: "animation", rating: 8.6},
      {id: 5, name: "Get Out", genre: "horror", rating: 7.8},
      {id: 6, name: "The Grand Budapest Hotel", genre: "comedy", rating: 8.1},
      {id: 7, name: "Mad Max: Fury Road", genre: "action", rating: 8.1},
      {id: 8, name: "Arrival", genre: "science fiction", rating: 7.9},
      {id: 9, name: "Parasite", genre: "thriller", rating: 8.5},
      {id: 10, name: "The Shawshank Redemption", genre: "drama", rating: 9.3}
    ]);

    selectedMovie = signal<Movie | undefined>(undefined);

    onMovieClicked(movie: Movie) {
        this.selectedMovie.set(movie);
    }
}
