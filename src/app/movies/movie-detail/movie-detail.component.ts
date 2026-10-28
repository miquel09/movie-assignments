import { Component, input, output } from '@angular/core';
import { Movie } from '../movie.interface';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [ FormsModule ],
  selector: 'cw-movie-detail',
  styleUrl: './movie-detail.component.scss',
  templateUrl: './movie-detail.component.html',
})
export class MovieDetailComponent {
  movie = input.required<Movie>()
  save = output<Movie>();

  public OnSaveClicked(){
    this.save.emit(this.movie());
  }
}
